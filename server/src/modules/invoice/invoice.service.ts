import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateInvoiceDto, userTenantId: string) {
    // Validate that dto.tenantId (if provided) matches authenticated user's tenant
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create invoice for a different tenant',
      );
    }

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        clientId: dto.clientId,
        projectId: dto.projectId,
        tenantId: userTenantId,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        subtotal: new Prisma.Decimal(dto.subtotal),
        tax: dto.tax ? new Prisma.Decimal(dto.tax) : undefined,
        discount: dto.discount ? new Prisma.Decimal(dto.discount) : undefined,
        total: new Prisma.Decimal(dto.total),
        paidAmount: dto.paidAmount
          ? new Prisma.Decimal(dto.paidAmount)
          : undefined,
        balanceAmount: new Prisma.Decimal(dto.balanceAmount),
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  findAll(userTenantId: string) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId: userTenantId,
      },
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

  async findOne(id: string, userTenantId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Verify tenant ownership
    if (invoice.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    // Prevent tenantId spoofing - ignore any tenantId in the update DTO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenantId, ...updateData } = dto;

    const data: Prisma.InvoiceUpdateInput = {};

    if (updateData.invoiceNumber) data.invoiceNumber = updateData.invoiceNumber;
    if (updateData.clientId)
      data.client = { connect: { id: updateData.clientId } };
    if (updateData.projectId)
      data.project = { connect: { id: updateData.projectId } };
    if (updateData.issueDate) data.issueDate = new Date(updateData.issueDate);
    if (updateData.dueDate) data.dueDate = new Date(updateData.dueDate);
    if (updateData.subtotal)
      data.subtotal = new Prisma.Decimal(updateData.subtotal);
    if (updateData.tax) data.tax = new Prisma.Decimal(updateData.tax);
    if (updateData.discount)
      data.discount = new Prisma.Decimal(updateData.discount);
    if (updateData.total) data.total = new Prisma.Decimal(updateData.total);
    if (updateData.paidAmount)
      data.paidAmount = new Prisma.Decimal(updateData.paidAmount);
    if (updateData.balanceAmount)
      data.balanceAmount = new Prisma.Decimal(updateData.balanceAmount);
    if (updateData.status) data.status = updateData.status;
    if (updateData.notes) data.notes = updateData.notes;

    return this.prisma.invoice.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    return this.prisma.invoice.delete({
      where: { id },
    });
  }
}
