import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        client: { connect: { id: dto.clientId } },
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        subtotal: new Prisma.Decimal(dto.subtotal),
        tax: dto.tax ? new Prisma.Decimal(dto.tax) : undefined,
        discount: dto.discount ? new Prisma.Decimal(dto.discount) : undefined,
        total: new Prisma.Decimal(dto.total),
        paidAmount: dto.paidAmount ? new Prisma.Decimal(dto.paidAmount) : undefined,
        balanceAmount: new Prisma.Decimal(dto.balanceAmount),
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  findAll() {
    return this.prisma.invoice.findMany({
      include: {
        client: true,
        project: true,
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true,
        payments: true,
      },
    });
  }

  update(id: string, dto: UpdateInvoiceDto) {
    const data: Prisma.InvoiceUpdateInput = {};
    
    if (dto.invoiceNumber) data.invoiceNumber = dto.invoiceNumber;
    if (dto.clientId) data.client = { connect: { id: dto.clientId } };
    if (dto.projectId) data.project = { connect: { id: dto.projectId } };
    if (dto.issueDate) data.issueDate = new Date(dto.issueDate);
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.subtotal) data.subtotal = new Prisma.Decimal(dto.subtotal);
    if (dto.tax) data.tax = new Prisma.Decimal(dto.tax);
    if (dto.discount) data.discount = new Prisma.Decimal(dto.discount);
    if (dto.total) data.total = new Prisma.Decimal(dto.total);
    if (dto.paidAmount) data.paidAmount = new Prisma.Decimal(dto.paidAmount);
    if (dto.balanceAmount) data.balanceAmount = new Prisma.Decimal(dto.balanceAmount);
    if (dto.status) data.status = dto.status;
    if (dto.notes) data.notes = dto.notes;
    
    return this.prisma.invoice.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.invoice.delete({
      where: { id },
    });
  }
}
