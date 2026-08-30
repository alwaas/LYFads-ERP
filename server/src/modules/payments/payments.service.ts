import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AllocatePaymentDto } from './dto/allocate-payment.dto';

import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreatePaymentDto, userTenantId: string, userId?: string) {
    // For backwards compatibility, if invoiceId is provided, verify it
    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
        select: { id: true, tenantId: true, clientId: true },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.tenantId !== userTenantId) {
        throw new ForbiddenException('Access denied to this invoice');
      }

      // Set clientId from invoice for backwards compatibility
      dto.clientId = invoice.clientId;
    }

    // If clientId is provided, verify it belongs to tenant
    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
        select: { id: true, tenantId: true },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      if (client.tenantId !== userTenantId) {
        throw new ForbiddenException('Access denied to this client');
      }
    }

    // Validate amount is positive
    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Use transaction to ensure atomicity
    const newPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          clientId: dto.clientId,
          amount: new Prisma.Decimal(dto.amount),
          paymentDate: new Date(dto.paymentDate),
          method: dto.method,
          referenceNo: dto.referenceNo,
          remarks: dto.remarks,
          status: PaymentStatus.ACTIVE,
          createdById: userId,
          tenantId: userTenantId,
        },
      });

      // If invoiceId was provided, create allocation for backwards compatibility
      if (dto.invoiceId) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: dto.invoiceId,
            amount: new Prisma.Decimal(dto.amount),
            tenantId: userTenantId,
          },
        });

        await this.refreshInvoice(dto.invoiceId, tx);
      }

      return payment;
    });

    await this.activityLogsService.log({
      action: 'PAYMENT_CREATED',
      module: 'PAYMENT',
      description: `Payment of ${dto.amount} created via ${dto.method}`,
      userId,
      tenantId: userTenantId,
    });

    return this.findOne(newPayment.id, userTenantId);
  }

  findAll(userTenantId: string) {
    return this.prisma.payment.findMany({
      where: {
        tenantId: userTenantId,
      },
      include: {
        invoice: {
          include: {
            client: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        allocations: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                clientId: true,
                total: true,
                client: {
                  select: {
                    id: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async findOne(id: string, userTenantId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            client: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        allocations: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                clientId: true,
                total: true,
                client: {
                  select: {
                    id: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify tenant ownership
    if (payment.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payment');
    }

    // Calculate remaining unallocated amount
    const totalAllocated = payment.allocations.reduce(
      (sum, allocation) => sum + Number(allocation.amount),
      0,
    );
    const remainingAmount = Number(payment.amount) - totalAllocated;

    return {
      ...payment,
      remainingAmount,
      totalAllocated,
    };
  }

  async update(id: string, dto: UpdatePaymentDto, userTenantId: string, userId?: string) {
    const oldPayment = await this.findOne(id, userTenantId);

    // Cannot update reversed or voided payments
    if (oldPayment.status !== PaymentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot update payment with status ${oldPayment.status}`,
      );
    }

    // Validate amount if provided
    if (dto.amount) {
      const newAmount = Number(dto.amount);
      if (newAmount <= 0) {
        throw new BadRequestException('Payment amount must be greater than zero');
      }

      // Check if new amount is less than already allocated
      const totalAllocated = oldPayment.allocations.reduce(
        (sum, allocation) => sum + Number(allocation.amount),
        0,
      );

      if (newAmount < totalAllocated) {
        throw new BadRequestException(
          `Cannot reduce payment amount below allocated amount (${totalAllocated})`,
        );
      }
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        method: dto.method,
        referenceNo: dto.referenceNo,
        remarks: dto.remarks,
      },
    });

    await this.activityLogsService.log({
      action: 'PAYMENT_UPDATED',
      module: 'PAYMENT',
      description: `Payment ${id} updated`,
      userId,
      tenantId: userTenantId,
    });

    return this.findOne(updatedPayment.id, userTenantId);
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const payment = await this.findOne(id, userTenantId);

    // Cannot delete reversed or voided payments
    if (payment.status !== PaymentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot delete payment with status ${payment.status}`,
      );
    }

    // Cannot delete payments with allocations
    if (payment.allocations.length > 0) {
      throw new BadRequestException(
        'Cannot delete payment with existing allocations. Use reverse/void instead.',
      );
    }

    await this.prisma.payment.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'PAYMENT_DELETED',
      module: 'PAYMENT',
      description: `Payment ${id} deleted`,
      userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Payment deleted successfully',
    };
  }

  async allocatePayment(
    paymentId: string,
    dto: AllocatePaymentDto,
    userTenantId: string,
    userId?: string,
  ) {
    // Verify payment exists and belongs to tenant
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        tenantId: true,
        amount: true,
        status: true,
        allocations: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payment');
    }

    if (payment.status !== PaymentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot allocate payment with status ${payment.status}`,
      );
    }

    // Verify invoice exists and belongs to tenant
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      select: {
        id: true,
        tenantId: true,
        total: true,
        paidAmount: true,
        balanceAmount: true,
        status: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    // Validate invoice can receive payment
    if (!this.canReceivePayment(invoice.status)) {
      throw new BadRequestException(
        `Cannot allocate payment to invoice with status ${invoice.status}`,
      );
    }

    // Validate allocation amount
    const allocationAmount = Number(dto.amount);
    if (allocationAmount <= 0) {
      throw new BadRequestException('Allocation amount must be greater than zero');
    }

    // Check allocation doesn't exceed invoice balance
    const invoiceBalance = Number(invoice.balanceAmount);
    if (allocationAmount > invoiceBalance) {
      throw new BadRequestException(
        `Allocation amount (${allocationAmount}) exceeds invoice balance (${invoiceBalance})`,
      );
    }

    // Check allocation doesn't exceed payment remaining balance
    const totalAllocated = payment.allocations.reduce(
      (sum, allocation) => sum + Number(allocation.amount),
      0,
    );
    const paymentRemaining = Number(payment.amount) - totalAllocated;
    if (allocationAmount > paymentRemaining) {
      throw new BadRequestException(
        `Allocation amount (${allocationAmount}) exceeds payment remaining balance (${paymentRemaining})`,
      );
    }

    // Check for duplicate allocation
    const existingAllocation = await this.prisma.paymentAllocation.findUnique({
      where: {
        paymentId_invoiceId: {
          paymentId,
          invoiceId: dto.invoiceId,
        },
      },
    });

    if (existingAllocation) {
      throw new BadRequestException(
        'Payment already allocated to this invoice',
      );
    }

    // Perform allocation in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.paymentAllocation.create({
        data: {
          paymentId,
          invoiceId: dto.invoiceId,
          amount: new Prisma.Decimal(allocationAmount),
          tenantId: userTenantId,
        },
      });

      await this.refreshInvoice(dto.invoiceId, tx);

      const updatedInvoice = await tx.invoice.findUnique({
        where: { id: dto.invoiceId },
        select: { id: true, paidAmount: true, balanceAmount: true, status: true },
      });

      const allocation = await tx.paymentAllocation.findFirst({
        where: { paymentId, invoiceId: dto.invoiceId },
        orderBy: { allocatedAt: 'desc' },
      });

      return {
        success: true,
        allocation: {
          ...allocation!,
          amount: allocation!.amount.toString(),
        },
        invoice: {
          ...updatedInvoice!,
          paidAmount: updatedInvoice!.paidAmount.toString(),
          balanceAmount: updatedInvoice!.balanceAmount.toString(),
        },
      };
    });

    await this.activityLogsService.log({
      action: 'PAYMENT_ALLOCATED',
      module: 'PAYMENT',
      description: `Payment ${paymentId} allocated ${allocationAmount} to invoice ${dto.invoiceId}`,
      userId,
      tenantId: userTenantId,
    });

    return result;
  }

  async reversePayment(
    id: string,
    userTenantId: string,
    userId?: string,
  ) {
    const payment = await this.findOne(id, userTenantId);

    if (payment.status !== PaymentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot reverse payment with status ${payment.status}`,
      );
    }

    // Perform reversal in transaction
    await this.prisma.$transaction(async (tx) => {
      // Reverse all allocations
      for (const allocation of payment.allocations) {
        await tx.paymentAllocation.delete({
          where: { id: allocation.id },
        });

        // Refresh invoice
        await this.refreshInvoice(allocation.invoiceId, tx);
      }

      // Update payment status
      await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REVERSED,
        },
      });
    });

    await this.activityLogsService.log({
      action: 'PAYMENT_REVERSED',
      module: 'PAYMENT',
      description: `Payment ${id} reversed`,
      userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Payment reversed successfully',
    };
  }

  async voidPayment(id: string, userTenantId: string, userId?: string) {
    const payment = await this.findOne(id, userTenantId);

    if (payment.status !== PaymentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot void payment with status ${payment.status}`,
      );
    }

    // Perform void in transaction
    await this.prisma.$transaction(async (tx) => {
      // Reverse all allocations
      for (const allocation of payment.allocations) {
        await tx.paymentAllocation.delete({
          where: { id: allocation.id },
        });

        // Refresh invoice
        await this.refreshInvoice(allocation.invoiceId, tx);
      }

      // Update payment status
      await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.VOID,
        },
      });
    });

    await this.activityLogsService.log({
      action: 'PAYMENT_VOIDED',
      module: 'PAYMENT',
      description: `Payment ${id} voided`,
      userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Payment voided successfully',
    };
  }

  private async refreshInvoice(
    invoiceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;

    const invoice = await prismaClient.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        allocations: true,
      },
    });

    if (!invoice) return;

    const paidAmount = invoice.allocations.reduce(
      (sum, allocation) => sum + Number(allocation.amount),
      0,
    );

    const total = Number(invoice.total);
    const balance = total - paidAmount;

    let status: InvoiceStatus = InvoiceStatus.ISSUED;

    if (paidAmount <= 0) {
      status = InvoiceStatus.ISSUED;
    } else if (balance <= 0) {
      status = InvoiceStatus.PAID;
    } else {
      status = InvoiceStatus.PARTIALLY_PAID;
    }

    await prismaClient.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        paidAmount: new Prisma.Decimal(paidAmount),
        balanceAmount: new Prisma.Decimal(balance),
        status,
      },
    });
  }

  private canReceivePayment(status: InvoiceStatus): boolean {
    const allowed: InvoiceStatus[] = [
      InvoiceStatus.ISSUED,
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.OVERDUE,
    ];
    return allowed.includes(status);
  }
}
