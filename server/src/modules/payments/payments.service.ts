import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import { InvoiceStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, userTenantId: string) {
    // Verify invoice exists and belongs to tenant
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      select: { id: true, tenantId: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Verify invoice belongs to the same tenant
    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    // Use transaction to ensure atomicity
    const newPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: new Prisma.Decimal(dto.amount),
          paymentDate: new Date(dto.paymentDate),
          method: dto.method,
          referenceNo: dto.referenceNo,
          remarks: dto.remarks,
          tenantId: userTenantId,
        },
      });

      await this.refreshInvoice(dto.invoiceId, tx);

      return payment;
    });

    return newPayment;
  }

  findAll(userTenantId: string) {
    return this.prisma.payment.findMany({
      where: {
        tenantId: userTenantId,
      },
      include: {
        invoice: true,
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
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify tenant ownership
    if (payment.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this payment');
    }

    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto, userTenantId: string) {
    const oldPayment = await this.findOne(id, userTenantId);

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

    await this.prisma.$transaction(async (tx) => {
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
        payments: true,
      },
    });

    if (!invoice) return;

    const paidAmount = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

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
}
