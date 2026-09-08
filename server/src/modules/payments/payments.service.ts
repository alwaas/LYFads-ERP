import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import {
  InvoiceStatus,
  PaymentStatus,
  PurchaseInvoiceStatus,
  ExpenseStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { GlService } from '../gl/gl.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly glService: GlService,
  ) {}

  async create(dto: CreatePaymentDto, userTenantId: string, userId?: string) {
    const hasInvoice = !!dto.invoiceId;
    const hasBill = !!dto.purchaseInvoiceId;
    const hasExpense = !!dto.expenseId;

    if ((hasInvoice && hasBill) || (hasInvoice && hasExpense) || (hasBill && hasExpense)) {
      throw new BadRequestException(
        'Payment must target either an invoice, a vendor bill, or an expense',
      );
    }

    if (hasBill) {
      const bill = await this.prisma.purchaseInvoice.findUnique({
        where: { id: dto.purchaseInvoiceId },
        select: { id: true, tenantId: true, status: true, balanceAmount: true },
      });

      if (!bill) {
        throw new NotFoundException('Vendor bill not found');
      }

      if (bill.tenantId !== userTenantId) {
        throw new ForbiddenException('Access denied to this vendor bill');
      }

      if (bill.status === PurchaseInvoiceStatus.VOIDED || bill.status === PurchaseInvoiceStatus.CANCELLED) {
        throw new ConflictException('Cannot pay a voided or cancelled vendor bill');
      }

      if (
        bill.status !== PurchaseInvoiceStatus.POSTED &&
        bill.status !== PurchaseInvoiceStatus.PARTIALLY_PAID
      ) {
        throw new ConflictException('Vendor bill must be posted before it can be paid');
      }
    } else if (hasInvoice) {
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
    } else if (hasExpense) {
      const expense = await this.prisma.expense.findUnique({
        where: { id: dto.expenseId },
        select: {
          id: true,
          tenantId: true,
          status: true,
          total: true,
          amount: true,
          taxAmount: true,
          amountPaid: true,
          balanceAmount: true,
          vendorId: true,
        },
      });

      if (!expense) {
        throw new NotFoundException('Expense not found');
      }

      if (expense.tenantId !== userTenantId) {
        throw new ForbiddenException('Access denied to this expense');
      }

      if (expense.status !== ExpenseStatus.POSTED) {
        throw new ConflictException('Expense must be posted before it can be paid');
      }

      const expenseTotal = expense.total ?? expense.amount;
      const alreadyPaid = expense.amountPaid ?? new Prisma.Decimal(0);
      const remainingBalance = new Prisma.Decimal(expenseTotal).minus(alreadyPaid);
      const paymentAmount = new Prisma.Decimal(dto.amount);

      if (paymentAmount.gt(remainingBalance)) {
        throw new BadRequestException(
          `Payment amount ${paymentAmount.toString()} exceeds remaining balance ${remainingBalance.toString()}`,
        );
      }
    }

    const newPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          purchaseInvoiceId: dto.purchaseInvoiceId,
          expenseId: dto.expenseId,
          amount: new Prisma.Decimal(dto.amount),
          paymentDate: new Date(dto.paymentDate),
          method: dto.method,
          referenceNo: dto.referenceNo,
          remarks: dto.remarks,
          status: PaymentStatus.ACTIVE,
          tenantId: userTenantId,
        },
      });

      if (dto.invoiceId) {
        await this.refreshInvoice(dto.invoiceId, tx);
      } else if (dto.purchaseInvoiceId) {
        await this.refreshPurchaseInvoice(dto.purchaseInvoiceId, tx);
      } else if (dto.expenseId) {
        await this.refreshExpense(dto.expenseId, tx);
      }

      return payment;
    });

    if (dto.invoiceId) {
      await this.glService.postInvoicePayment(
        userTenantId,
        newPayment.id,
        newPayment.amount,
        dto.invoiceId,
        userId,
      );
    } else if (dto.purchaseInvoiceId) {
      await this.glService.postVendorPayment(
        userTenantId,
        newPayment.id,
        newPayment.amount,
        dto.purchaseInvoiceId,
        userId,
      );
    } else if (dto.expenseId) {
      const expense = await this.prisma.expense.findUnique({
        where: { id: dto.expenseId },
        select: { vendorId: true },
      });
      if (expense?.vendorId) {
        await this.glService.postExpensePayment(
          userTenantId,
          newPayment.id,
          newPayment.amount,
          dto.expenseId,
          userId,
        );
      }
    }

    const targetLabel = dto.purchaseInvoiceId
      ? 'vendor bill'
      : dto.invoiceId
        ? 'invoice'
        : dto.expenseId
          ? 'expense'
          : 'no bill';

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'PAYMENT',
      description: `Payment of ${dto.amount} ${dto.method} created against ${targetLabel}.`,
      userId,
      tenantId: userTenantId,
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
          purchaseInvoice: true,
          expense: true,
          allocations: {
            include: {
              invoice: true,
              purchaseInvoice: true,
              expense: true,
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
        purchaseInvoice: true,
        expense: true,
        allocations: {
          include: {
            invoice: true,
            purchaseInvoice: true,
            expense: true,
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

  async update(id: string, dto: UpdatePaymentDto, userTenantId: string, userId?: string) {
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

      if (oldPayment.invoiceId) {
        await this.refreshInvoice(oldPayment.invoiceId, tx);
      } else if (oldPayment.purchaseInvoiceId) {
        await this.refreshPurchaseInvoice(oldPayment.purchaseInvoiceId, tx);
      } else if (oldPayment.expenseId) {
        await this.refreshExpense(oldPayment.expenseId, tx);
      }

      return payment;
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'PAYMENT',
      description: `Payment ${updatedPayment.id} updated.`,
      userId,
      tenantId: userTenantId,
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

      if (payment.invoiceId) {
        await this.refreshInvoice(payment.invoiceId, tx);
      } else if (payment.purchaseInvoiceId) {
        await this.refreshPurchaseInvoice(payment.purchaseInvoiceId, tx);
      } else if (payment.expenseId) {
        await this.refreshExpense(payment.expenseId, tx);
      }
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

    if (payment.invoiceId) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.VOIDED,
            voidedAt: new Date(),
            voidedById: userId,
          },
        });
        await this.refreshInvoice(payment.invoiceId!, tx);
      });
    } else if (payment.purchaseInvoiceId) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.VOIDED,
            voidedAt: new Date(),
            voidedById: userId,
          },
        });
        await this.refreshPurchaseInvoice(payment.purchaseInvoiceId!, tx);
      });
    } else if (payment.expenseId) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.VOIDED,
            voidedAt: new Date(),
            voidedById: userId,
          },
        });
        await this.refreshExpense(payment.expenseId!, tx);
      });
    }

    const voidedPayment = await this.findOne(id, userTenantId);

    await this.activityLogsService.log({
      action: 'VOID',
      module: 'PAYMENT',
      description: `Payment ${id} voided.`,
      userId,
      tenantId: userTenantId,
    });

    return voidedPayment;
  }

  private async refreshInvoice(invoiceId: string, tx?: Prisma.TransactionClient) {
    const prismaClient = tx || this.prisma;

    const invoice = await prismaClient.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        allocations: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!invoice) return;

    const paidFromDirectPayments = invoice.payments
      .filter((p) => p.status === PaymentStatus.ACTIVE && p.invoiceId === invoiceId)
      .reduce((sum, p) => sum.plus(new Prisma.Decimal(p.amount)), new Prisma.Decimal(0));

    const paidFromAllocations = invoice.allocations
      .filter((alloc) => alloc.payment.status === PaymentStatus.ACTIVE)
      .reduce((sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)), new Prisma.Decimal(0));

    const paidAmount = paidFromDirectPayments.plus(paidFromAllocations);

    const total = new Prisma.Decimal(invoice.total);

    const balance = total.minus(paidAmount);

    let status: InvoiceStatus = InvoiceStatus.SENT;

    if (paidAmount.lte(0)) {
      status = InvoiceStatus.SENT;
    } else if (balance.lte(0)) {
      status = InvoiceStatus.PAID;
    } else {
      status = InvoiceStatus.PARTIALLY_PAID;
    }

    await prismaClient.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount,
        balanceAmount: balance,
        status,
      },
    });
  }

  private async refreshPurchaseInvoice(
    purchaseInvoiceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;

    const bill = await prismaClient.purchaseInvoice.findUnique({
      where: { id: purchaseInvoiceId },
      include: {
        payments: true,
        allocations: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!bill) return;

    const paidFromDirectPayments = bill.payments
      .filter((p) => p.status === PaymentStatus.ACTIVE && p.purchaseInvoiceId === purchaseInvoiceId)
      .reduce((sum, p) => sum.plus(new Prisma.Decimal(p.amount)), new Prisma.Decimal(0));

    const paidFromAllocations = bill.allocations
      .filter((alloc) => alloc.payment.status === PaymentStatus.ACTIVE)
      .reduce((sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)), new Prisma.Decimal(0));

    const paidAmount = paidFromDirectPayments.plus(paidFromAllocations);

    const total = new Prisma.Decimal(bill.total);
    const balance = total.minus(paidAmount);

    let status: PurchaseInvoiceStatus;

    if (paidAmount.lte(0)) {
      status = PurchaseInvoiceStatus.POSTED;
    } else if (balance.lte(0)) {
      status = PurchaseInvoiceStatus.PAID;
    } else {
      status = PurchaseInvoiceStatus.PARTIALLY_PAID;
    }

    await prismaClient.purchaseInvoice.update({
      where: { id: purchaseInvoiceId },
      data: {
        amountPaid: paidAmount,
        balanceAmount: balance,
        status,
      },
    });
  }

  private async refreshExpense(expenseId: string, tx?: Prisma.TransactionClient) {
    const prismaClient = tx || this.prisma;

    const expense = await prismaClient.expense.findUnique({
      where: { id: expenseId },
      include: {
        payments: true,
        allocations: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!expense) return;

    const paidFromDirectPayments = expense.payments
      .filter((p) => p.status === PaymentStatus.ACTIVE && p.expenseId === expenseId)
      .reduce((sum, p) => sum.plus(new Prisma.Decimal(p.amount)), new Prisma.Decimal(0));

    const paidFromAllocations = expense.allocations
      .filter((alloc) => alloc.payment.status === PaymentStatus.ACTIVE)
      .reduce((sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)), new Prisma.Decimal(0));

    const paidAmount = paidFromDirectPayments.plus(paidFromAllocations);

    const expenseTotal = expense.total ?? expense.amount;
    const balance = new Prisma.Decimal(expenseTotal).minus(paidAmount);

    let status: ExpenseStatus;

    if (paidAmount.lte(0)) {
      status = ExpenseStatus.POSTED;
    } else if (balance.lte(0)) {
      status = ExpenseStatus.PAID;
    } else {
      status = ExpenseStatus.POSTED;
    }

    await prismaClient.expense.update({
      where: { id: expenseId },
      data: {
        amountPaid: paidAmount,
        balanceAmount: balance,
        paidAt: balance.lte(0) ? new Date() : undefined,
        status,
      },
    });
  }
}
