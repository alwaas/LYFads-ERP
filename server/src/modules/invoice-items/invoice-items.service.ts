import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Injectable()
export class InvoiceItemsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceItemDto, userTenantId: string) {
    // ... existing create code
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

    return this.prisma.invoiceItem.create({
      data: {
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        amount: dto.amount,
        invoiceId: dto.invoiceId,
        tenantId: userTenantId,
      },
    });
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (search.search) {
      where.description = { contains: search.search, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoiceItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoice: true,
        },
      }),
      this.prisma.invoiceItem.count({ where }),
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
    const invoiceItem = await this.prisma.invoiceItem.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });

    if (!invoiceItem) {
      throw new NotFoundException('Invoice item not found');
    }

    // Verify tenant ownership
    if (invoiceItem.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this invoice item');
    }

    return invoiceItem;
  }

  async update(id: string, dto: UpdateInvoiceItemDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    return this.prisma.invoiceItem.update({
      where: { id },
      data: {
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        amount: dto.amount,
      },
    });
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    return this.prisma.invoiceItem.delete({
      where: { id },
    });
  }
}
