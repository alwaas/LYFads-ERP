import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import {
  InvoiceStatus,
} from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        method: dto.method,
        referenceNo: dto.referenceNo,
        remarks: dto.remarks,
      },
    });

    await this.refreshInvoice(dto.invoiceId);

    return payment;
  }

  findAll() {
    return this.prisma.payment.findMany({
      include: {
        invoice: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const payment =
      await this.prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: true,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    return payment;
  }

  async update(
    id: string,
    dto: UpdatePaymentDto,
  ) {
    const oldPayment =
      await this.prisma.payment.findUnique({
        where: { id },
      });

    if (!oldPayment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    const payment =
      await this.prisma.payment.update({
        where: { id },
        data: {
          amount: dto.amount,
          paymentDate: dto.paymentDate
            ? new Date(dto.paymentDate)
            : undefined,
          method: dto.method,
          referenceNo: dto.referenceNo,
          remarks: dto.remarks,
        },
      });

    await this.refreshInvoice(
      oldPayment.invoiceId,
    );

    return payment;
  }

  async remove(id: string) {
    const payment =
      await this.prisma.payment.findUnique({
        where: { id },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    await this.prisma.payment.delete({
      where: { id },
    });

    await this.refreshInvoice(
      payment.invoiceId,
    );

    return {
      success: true,
      message:
        'Payment deleted successfully',
    };
  }

  private async refreshInvoice(
    invoiceId: string,
  ) {
    const invoice =
      await this.prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },
        include: {
          payments: true,
        },
      });

    if (!invoice) return;

    const paidAmount =
      invoice.payments.reduce(
        (sum, payment) =>
          sum + Number(payment.amount),
        0,
      );

    const total =
      Number(invoice.total);

    const balance =
      total - paidAmount;

    let status: InvoiceStatus =
      InvoiceStatus.SENT;

    if (paidAmount <= 0) {
      status = InvoiceStatus.SENT;
    } else if (balance <= 0) {
      status = InvoiceStatus.PAID;
    } else {
      status =
        InvoiceStatus.PARTIALLY_PAID;
    }

    await this.prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        paidAmount,
        balanceAmount: balance,
        status,
      },
    });
  }
}