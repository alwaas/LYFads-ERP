import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  Prisma,
  PaymentStatus,
  InvoiceStatus,
  PurchaseInvoiceStatus,
  ExpenseStatus,
} from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { CreatePaymentAllocationDto } from './dto/create-payment-allocation.dto';

@Injectable()
export class PaymentAllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreatePaymentAllocationDto, userTenantId: string, userId?: string) {
    const hasInvoice = !!dto.invoiceId;
    const hasBill = !!dto.purchaseInvoiceId;
    const hasExpense = !!dto.expenseId;

    if ((hasInvoice && hasBill) || (hasInvoice && hasExpense) || (hasBill && hasExpense) || (!hasInvoice && !hasBill && !hasExpense)) {
      throw new BadRequestException(
        'Allocation must target either an invoice, a vendor bill, or an expense',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        invoiceId: true,
        purchaseInvoiceId: true,
        expenseId: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payment');
    }

    if (payment.status === PaymentStatus.VOIDED) {
      throw new ConflictException('Cannot allocate against a voided payment');
    }

    if (payment.invoiceId && !hasInvoice) {
      throw new ConflictException('This payment is a customer receipt; target an invoice');
    }
    if (payment.purchaseInvoiceId && !hasBill) {
      throw new ConflictException('This payment is a vendor payment; target a vendor bill');
    }
    if (payment.expenseId && !hasExpense) {
      throw new ConflictException('This payment is an expense payment; target an expense');
    }

    const allocationAmount = new Prisma.Decimal(dto.amount);

    if (allocationAmount.lte(0)) {
      throw new BadRequestException('Allocation amount must be positive');
    }

    // Cross-tenant + over-allocation guards are shared by both branches.
    const paymentTotal = await this.getPaymentTotal(dto.paymentId);

    const existingAllocations = await this.prisma.paymentAllocation.findMany({
      where: { paymentId: dto.paymentId },
      select: { amount: true },
    });

    const totalAllocated = existingAllocations.reduce(
      (sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)),
      new Prisma.Decimal(0),
    );

    if (totalAllocated.plus(allocationAmount).gt(paymentTotal)) {
      throw new ConflictException('Allocation exceeds remaining payment amount');
    }

    if (hasInvoice) {
      return this.allocateToInvoice(dto, userTenantId, userId);
    }

    if (hasExpense) {
      return this.allocateToExpense(dto, userTenantId, userId);
    }

    return this.allocateToPurchaseInvoice(
      dto,
      paymentTotal,
      totalAllocated,
      userTenantId,
      userId,
    );
  }

  private async allocateToInvoice(
    dto: CreatePaymentAllocationDto,
    userTenantId: string,
    userId?: string,
  ) {
    const invoiceId = dto.invoiceId!;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, tenantId: true, balanceAmount: true, total: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    const invoiceAllocations = await this.prisma.paymentAllocation.findMany({
      where: { invoiceId: invoiceId },
      select: { amount: true },
    });

    const totalInvoiceAllocated = invoiceAllocations.reduce(
      (sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)),
      new Prisma.Decimal(0),
    );

    const directPayments = await this.prisma.payment.findMany({
      where: {
        invoiceId: invoiceId,
        status: PaymentStatus.ACTIVE,
        id: { not: dto.paymentId },
      },
      select: { amount: true },
    });

    const totalDirectPayments = directPayments.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0),
    );

    const remainingBalance = new Prisma.Decimal(invoice.total)
      .minus(totalInvoiceAllocated)
      .minus(totalDirectPayments);

    if (new Prisma.Decimal(dto.amount).gt(remainingBalance)) {
      throw new ConflictException('Allocation exceeds remaining invoice balance');
    }

    const existing = await this.prisma.paymentAllocation.findFirst({
      where: {
        paymentId: dto.paymentId,
        invoiceId: invoiceId,
      },
    });

    if (existing) {
      throw new ConflictException('This payment is already allocated to this invoice');
    }

    const allocation = await this.prisma.$transaction(async (tx) => {
      const alloc = await tx.paymentAllocation.create({
        data: {
          paymentId: dto.paymentId,
          invoiceId: invoiceId,
          amount: new Prisma.Decimal(dto.amount),
          tenantId: userTenantId,
        },
      });

      await this.refreshInvoice(invoiceId, tx);

      return alloc;
    });

    await this.activityLogsService.log({
      action: 'ALLOCATE',
      module: 'PAYMENT',
      description: `Payment ${dto.paymentId} allocated ${dto.amount} to invoice ${invoiceId}.`,
      userId,
      tenantId: userTenantId,
    });

    return allocation;
  }

  private async allocateToPurchaseInvoice(
    dto: CreatePaymentAllocationDto,
    paymentTotal: Prisma.Decimal,
    totalAllocated: Prisma.Decimal,
    userTenantId: string,
    userId?: string,
  ) {
    const billId = dto.purchaseInvoiceId!;

    const bill = await this.prisma.purchaseInvoice.findUnique({
      where: { id: billId },
      select: {
        id: true,
        tenantId: true,
        total: true,
        balanceAmount: true,
        status: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Vendor bill not found');
    }

    if (bill.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this vendor bill');
    }

    if (
      bill.status === PurchaseInvoiceStatus.VOIDED ||
      bill.status === PurchaseInvoiceStatus.CANCELLED
    ) {
      throw new ConflictException('Cannot allocate against a voided or cancelled vendor bill');
    }

    if (
      bill.status !== PurchaseInvoiceStatus.POSTED &&
      bill.status !== PurchaseInvoiceStatus.PARTIALLY_PAID
    ) {
      throw new ConflictException(
        'Vendor bill must be posted before a payment can be allocated to it',
      );
    }

    if (new Prisma.Decimal(dto.amount).gt(paymentTotal.minus(totalAllocated))) {
      throw new ConflictException('Allocation exceeds remaining payment amount');
    }

    const billAllocations = await this.prisma.paymentAllocation.findMany({
      where: { purchaseInvoiceId: billId },
      select: { amount: true },
    });

    const totalBillAllocated = billAllocations.reduce(
      (sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)),
      new Prisma.Decimal(0),
    );

    const billDirectPayments = await this.prisma.payment.findMany({
      where: {
        purchaseInvoiceId: billId,
        status: PaymentStatus.ACTIVE,
        id: { not: dto.paymentId },
      },
      select: { amount: true },
    });

    const totalDirectPayments = billDirectPayments.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0),
    );

    const remainingBalance = new Prisma.Decimal(bill.total)
      .minus(totalBillAllocated)
      .minus(totalDirectPayments);

    if (new Prisma.Decimal(dto.amount).gt(remainingBalance)) {
      throw new ConflictException('Allocation exceeds remaining vendor bill balance');
    }

    const existing = await this.prisma.paymentAllocation.findFirst({
      where: {
        paymentId: dto.paymentId,
        purchaseInvoiceId: billId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'This payment is already allocated to this vendor bill',
      );
    }

    const allocation = await this.prisma.$transaction(async (tx) => {
      const alloc = await tx.paymentAllocation.create({
        data: {
          paymentId: dto.paymentId,
          purchaseInvoiceId: billId,
          amount: new Prisma.Decimal(dto.amount),
          tenantId: userTenantId,
        },
      });

      await this.refreshPurchaseInvoice(billId, tx);

      return alloc;
    });

    await this.activityLogsService.log({
      action: 'ALLOCATE',
      module: 'PAYMENT',
      description: `Payment ${dto.paymentId} allocated ${dto.amount} to vendor bill ${billId}.`,
      userId,
      tenantId: userTenantId,
    });

    return allocation;
  }

  private async allocateToExpense(
    dto: CreatePaymentAllocationDto,
    userTenantId: string,
    userId?: string,
  ) {
    const expenseId = dto.expenseId!;

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      select: { id: true, tenantId: true, balanceAmount: true, total: true },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this expense');
    }

    if (expense.balanceAmount && new Prisma.Decimal(dto.amount).gt(expense.balanceAmount)) {
      throw new ConflictException('Allocation exceeds remaining expense balance');
    }

    const expenseAllocations = await this.prisma.paymentAllocation.findMany({
      where: { expenseId: expenseId },
      select: { amount: true },
    });

    const totalExpenseAllocated = expenseAllocations.reduce(
      (sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)),
      new Prisma.Decimal(0),
    );

    const expenseDirectPayments = await this.prisma.payment.findMany({
      where: {
        expenseId: expenseId,
        status: PaymentStatus.ACTIVE,
        id: { not: dto.paymentId },
      },
      select: { amount: true },
    });

    const totalDirectPayments = expenseDirectPayments.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0),
    );

    const remainingBalance = new Prisma.Decimal(expense.total ?? 0)
      .minus(totalExpenseAllocated)
      .minus(totalDirectPayments);

    if (new Prisma.Decimal(dto.amount).gt(remainingBalance)) {
      throw new ConflictException('Allocation exceeds remaining expense balance');
    }

    const existing = await this.prisma.paymentAllocation.findFirst({
      where: {
        paymentId: dto.paymentId,
        expenseId: expenseId,
      },
    });

    if (existing) {
      throw new ConflictException('This payment is already allocated to this expense');
    }

    const allocation = await this.prisma.$transaction(async (tx) => {
      const alloc = await tx.paymentAllocation.create({
        data: {
          paymentId: dto.paymentId,
          expenseId: expenseId,
          amount: new Prisma.Decimal(dto.amount),
          tenantId: userTenantId,
        },
      });

      await this.refreshExpense(expenseId, tx);

      return alloc;
    });

    await this.activityLogsService.log({
      action: 'ALLOCATE',
      module: 'PAYMENT',
      description: `Payment ${dto.paymentId} allocated ${dto.amount} to expense ${expenseId}.`,
      userId,
      tenantId: userTenantId,
    });

    return allocation;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = { tenantId: userTenantId };

    if (search.search) {
      where.OR = [
        { payment: { referenceNo: { contains: search.search, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: search.search, mode: 'insensitive' } } },
        { purchaseInvoice: { invoiceNumber: { contains: search.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.paymentAllocation.findMany({
        where,
        skip,
        take: limit,
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              method: true,
              referenceNo: true,
              status: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              balanceAmount: true,
              client: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
          purchaseInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              balanceAmount: true,
              vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          expense: {
            select: {
              id: true,
              description: true,
              total: true,
              amount: true,
              balanceAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentAllocation.count({ where }),
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
    const allocation = await this.prisma.paymentAllocation.findUnique({
      where: { id },
      include: {
        payment: true,
        invoice: true,
        purchaseInvoice: true,
        expense: true,
      },
    });

    if (!allocation) {
      throw new NotFoundException('Payment allocation not found');
    }

    if (allocation.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payment allocation');
    }

    return allocation;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const allocation = await this.findOne(id, userTenantId);

    if (allocation.payment && allocation.payment.status === PaymentStatus.VOIDED) {
      throw new ConflictException('Cannot remove allocation from a voided payment');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAllocation.delete({
        where: { id },
      });

      if (allocation.invoiceId) {
        await this.refreshInvoice(allocation.invoiceId, tx);
      } else if (allocation.purchaseInvoiceId) {
        await this.refreshPurchaseInvoice(allocation.purchaseInvoiceId, tx);
      } else if (allocation.expenseId) {
        await this.refreshExpense(allocation.expenseId, tx);
      }
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'PAYMENT_ALLOCATION',
      description: `Payment allocation ${id} removed.`,
      userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Payment allocation removed successfully',
    };
  }

  private async getPaymentTotal(paymentId: string): Promise<Prisma.Decimal> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return new Prisma.Decimal(payment.amount);
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
