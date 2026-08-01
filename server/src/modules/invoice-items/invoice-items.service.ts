import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';

@Injectable()
export class InvoiceItemsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateInvoiceItemDto) {
    return this.prisma.invoiceItem.create({
      data: dto,
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
