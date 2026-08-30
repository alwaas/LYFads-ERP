import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PaymentStatus, InvoiceStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { CreatePaymentAllocationDto } from './dto/create-payment-allocation.dto';

@Injectable()
export class PaymentAllocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentAllocationDto, userTenantId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      select: { id: true, tenantId: true, status: true, invoiceId: true },
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

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      select: { id: true, tenantId: true, balanceAmount: true, total: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    const allocationAmount = new Prisma.Decimal(dto.amount);

    if (allocationAmount.lte(0)) {
      throw new BadRequestException('Allocation amount must be positive');
    }

    const existingAllocations = await this.prisma.paymentAllocation.findMany({
      where: { paymentId: dto.paymentId },
      select: { amount: true },
    });

    const totalAllocated = existingAllocations.reduce(
      (sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)),
      new Prisma.Decimal(0),
    );

    const paymentAmount = payment.invoiceId === dto.invoiceId
      ? await this.getDirectPaymentAmount(dto.paymentId, dto.invoiceId)
      : 0;

    const remainingPaymentAmount = new Prisma.Decimal(payment.invoiceId === dto.invoiceId
      ? await this.getDirectPaymentAmount(dto.paymentId, dto.invoiceId)
      : 0).plus(totalAllocated);

    const paymentTotal = await this.getPaymentTotal(dto.paymentId);

    if (totalAllocated.plus(allocationAmount).gt(paymentTotal)) {
      throw new ConflictException('Allocation exceeds remaining payment amount');
    }

    const invoiceAllocations = await this.prisma.paymentAllocation.findMany({
      where: { invoiceId: dto.invoiceId },
      select: { amount: true },
    });

    const totalInvoiceAllocated = invoiceAllocations.reduce(
      (sum, alloc) => sum.plus(new Prisma.Decimal(alloc.amount)),
      new Prisma.Decimal(0),
    );

    const directPayments = await this.prisma.payment.findMany({
      where: {
        invoiceId: dto.invoiceId,
        status: PaymentStatus.ACTIVE,
        id: { not: dto.paymentId },
      },
      select: { amount: true },
    });

    const totalDirectPayments = directPayments.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0),
    );

    const remainingBalance = new Prisma.Decimal(invoice.total).minus(totalInvoiceAllocated).minus(totalDirectPayments);

    if (allocationAmount.gt(remainingBalance)) {
      throw new ConflictException('Allocation exceeds remaining invoice balance');
    }

    const existing = await this.prisma.paymentAllocation.findFirst({
      where: {
        paymentId: dto.paymentId,
        invoiceId: dto.invoiceId,
      },
    });

    if (existing) {
      throw new ConflictException('This payment is already allocated to this invoice');
    }

    const allocation = await this.prisma.$transaction(async (tx) => {
      const alloc = await tx.paymentAllocation.create({
        data: {
          paymentId: dto.paymentId,
          invoiceId: dto.invoiceId,
          amount: allocationAmount,
          tenantId: userTenantId,
        },
      });

      await this.refreshInvoice(dto.invoiceId, tx);

      return alloc;
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

  async remove(id: string, userTenantId: string) {
    const allocation = await this.findOne(id, userTenantId);

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAllocation.delete({
        where: { id },
      });

      await this.refreshInvoice(allocation.invoiceId, tx);
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

  private async getDirectPaymentAmount(paymentId: string, invoiceId: string): Promise<number> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, invoiceId },
      select: { amount: true },
    });

    if (!payment) {
      return 0;
    }

    return Number(payment.amount);
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
}
