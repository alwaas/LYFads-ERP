import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoiceItemsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceItemDto, userTenantId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      select: { id: true, tenantId: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    return this.prisma.invoiceItem.create({
      data: {
        description: dto.description,
        quantity: new Prisma.Decimal(dto.quantity),
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        taxRate: dto.taxRate ? new Prisma.Decimal(dto.taxRate) : undefined,
        taxAmount: dto.taxAmount ? new Prisma.Decimal(dto.taxAmount) : undefined,
        discount: dto.discount ? new Prisma.Decimal(dto.discount) : undefined,
        lineTotal: new Prisma.Decimal(dto.lineTotal),
        invoiceId: dto.invoiceId,
        tenantId: userTenantId,
      },
    });
  }

  findAll(userTenantId: string) {
    return this.prisma.invoiceItem.findMany({
      where: {
        tenantId: userTenantId,
      },
      include: {
        invoice: true,
      },
    });
  }

  async findOne(id: string, userTenantId: string) {
    const invoiceItem = await this.prisma.invoiceItem.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });

    if (!invoiceItem) {
      throw new NotFoundException('Invoice item not found');
    }

    if (invoiceItem.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice item');
    }

    return invoiceItem;
  }

  async update(id: string, dto: UpdateInvoiceItemDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    const data: Prisma.InvoiceItemUpdateInput = {};

    if (dto.description !== undefined) data.description = dto.description;
    if (dto.quantity !== undefined) data.quantity = new Prisma.Decimal(dto.quantity);
    if (dto.unitPrice !== undefined) data.unitPrice = new Prisma.Decimal(dto.unitPrice);
    if (dto.taxRate !== undefined) data.taxRate = dto.taxRate ? new Prisma.Decimal(dto.taxRate) : undefined;
    if (dto.taxAmount !== undefined) data.taxAmount = dto.taxAmount ? new Prisma.Decimal(dto.taxAmount) : undefined;
    if (dto.discount !== undefined) data.discount = dto.discount ? new Prisma.Decimal(dto.discount) : undefined;
    if (dto.lineTotal !== undefined) data.lineTotal = new Prisma.Decimal(dto.lineTotal);

    return this.prisma.invoiceItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    return this.prisma.invoiceItem.delete({
      where: { id },
    });
  }
}
