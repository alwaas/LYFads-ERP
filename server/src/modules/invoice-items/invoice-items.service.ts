import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';

@Injectable()
export class InvoiceItemsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceItemDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      select: { id: true, tenantId: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.invoiceItem.create({
      data: {
        ...dto,
        tenantId: invoice.tenantId,
      },
    });
  }

  findAll() {
    return this.prisma.invoiceItem.findMany({
      include: {
        invoice: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.invoiceItem.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });
  }

  update(id: string, dto: UpdateInvoiceItemDto) {
    return this.prisma.invoiceItem.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.invoiceItem.delete({
      where: { id },
    });
  }
}
