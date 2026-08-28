import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, userTenantId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      select: { id: true, tenantId: true, balanceAmount: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    const newPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: new Prisma.Decimal(dto.amount),
          paymentDate: new Date(dto.paymentDate),
          method: dto.method,
          referenceNo: dto.referenceNo,
          remarks: dto.remarks,
          status: PaymentStatus.ACTIVE,
          tenantId: userTenantId,
        },
      });

      await this.refreshInvoice(dto.invoiceId, tx);

      return payment;
    });

    return newPayment;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, method?: string, userTenantId?: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      ...(userTenantId ? { tenantId: userTenantId } : {}),
      status: PaymentStatus.ACTIVE,
    };

    if (search.search) {
      where.OR = [
        { referenceNo: { contains: search.search, mode: 'insensitive' } },
        { method: { contains: search.search, mode: 'insensitive' } },
      ];
    }

    if (method && ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE'].includes(method)) {
      where.method = method;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoice: true,
          allocations: {
            include: {
              invoice: true,
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async findOne(id: string, userTenantId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        allocations: {
          include: {
            invoice: true,
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

    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto, userTenantId: string) {
    const oldPayment = await this.findOne(id, userTenantId);

    if (oldPayment.status === PaymentStatus.VOIDED) {
      throw new ConflictException('Cannot update a voided payment');
    }

    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id },
        data: {
          amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
          method: dto.method,
          referenceNo: dto.referenceNo,
          remarks: dto.remarks,
        },
      });

      await this.refreshInvoice(oldPayment.invoiceId, tx);

      return payment;
    });

    return updatedPayment;
  }

  async remove(id: string, userTenantId: string) {
    const payment = await this.findOne(id, userTenantId);

    if (payment.status === PaymentStatus.VOIDED) {
      throw new ConflictException('Cannot delete a voided payment');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAllocation.deleteMany({
        where: { paymentId: id },
      });

      await tx.payment.delete({
        where: { id },
      });

      await this.refreshInvoice(payment.invoiceId, tx);
    });

    return {
      success: true,
      message: 'Payment deleted successfully',
    };
  }

  async voidPayment(id: string, userTenantId: string, userId?: string) {
    const payment = await this.findOne(id, userTenantId);

    if (payment.status === PaymentStatus.VOIDED) {
      throw new ConflictException('Payment is already voided');
    }

    const voidedPayment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.VOIDED,
          voidedAt: new Date(),
          voidedById: userId,
        },
      });

      await this.refreshInvoice(payment.invoiceId, tx);

      return updated;
    });

    return voidedPayment;
  }

  private async refreshInvoice(
    invoiceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;

    const invoice = await prismaClient.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        allocations: {
          where: {
            payment: {
              status: PaymentStatus.ACTIVE,
            },
          },
        },
      },
    });

    if (!invoice) return;

    const paidFromDirectPayments = invoice.payments
      .filter((p) => p.status === PaymentStatus.ACTIVE && p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const paidFromAllocations = invoice.allocations
      .reduce((sum, alloc) => sum + Number(alloc.amount), 0);

    const paidAmount = paidFromDirectPayments + paidFromAllocations;

    const total = Number(invoice.total);

    const balance = total - paidAmount;

    let status: InvoiceStatus = InvoiceStatus.SENT;

    if (paidAmount <= 0) {
      status = InvoiceStatus.SENT;
    } else if (balance <= 0) {
      status = InvoiceStatus.PAID;
    } else {
      status = InvoiceStatus.PARTIALLY_PAID;
    }

    await prismaClient.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: new Prisma.Decimal(paidAmount),
        balanceAmount: new Prisma.Decimal(balance),
        status,
      },
    });
  }
}
