import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { GlService } from '../gl/gl.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { EntitlementService } from '../subscriptions/entitlement.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly glService: GlService,
    private readonly entitlementService: EntitlementService,
  ) {}

  async create(dto: CreateInvoiceDto, userTenantId: string, userId?: string) {
    await this.entitlementService.enforceLimit(userTenantId, 'MAX_INVOICES');

    // Validate that dto.tenantId (if provided) matches authenticated user's tenant
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create invoice for a different tenant',
      );
    }

    // Validate client belongs to tenant
    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        tenantId: userTenantId,
      },
      select: { id: true, companyName: true },
    });

    if (!client) {
      throw new ForbiddenException(
        'Client does not belong to the current tenant.',
      );
    }

    // Validate project belongs to tenant (if provided)
    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: dto.projectId,
          tenantId: userTenantId,
        },
        select: { id: true },
      });

      if (!project) {
        throw new ForbiddenException(
          'Project does not belong to the current tenant.',
        );
      }
    }

    // Validate salesOrder belongs to tenant (if provided)
    if (dto.salesOrderId) {
      const salesOrder = await this.prisma.salesOrder.findFirst({
        where: {
          id: dto.salesOrderId,
          tenantId: userTenantId,
        },
        select: { id: true },
      });

      if (!salesOrder) {
        throw new ForbiddenException(
          'Sales order does not belong to the current tenant.',
        );
      }
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: userTenantId },
      select: { currency: true },
    });
    const currency = (dto.currency || tenant?.currency || 'USD').toUpperCase();

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        clientId: dto.clientId,
        projectId: dto.projectId,
        salesOrderId: dto.salesOrderId,
        tenantId: userTenantId,
        currency,
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

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'INVOICE',
      description: `Invoice ${invoice.invoiceNumber} created for client ${client.companyName}.`,
      userId,
      tenantId: userTenantId,
    });

    if (invoice.status !== InvoiceStatus.DRAFT) {
      try {
        const netAmount = invoice.subtotal ?? invoice.total.minus(invoice.tax ?? 0);
        await this.glService.postInvoice(
          userTenantId,
          invoice.id,
          netAmount,
          invoice.tax,
          userId,
        );
      } catch (err) {
        void err;
      }
    }

    return invoice;
  }
  async findAll(pagination: PaginationDto, search: SearchDto, status?: string, userTenantId?: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      ...(userTenantId ? { tenantId: userTenantId } : {}),
    };

    if (search.search) {
      where.client = {
        is: {
          companyName: { contains: search.search, mode: 'insensitive' },
        },
      };
    }

    if (status && ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          project: true,
          salesOrder: true,
          items: true,
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.invoice.count({ where }),
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
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        salesOrder: true,
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

  async update(
    id: string,
    dto: UpdateInvoiceDto,
    userTenantId: string,
    userId?: string,
  ) {
    const oldInvoice = await this.findOne(id, userTenantId);

    // Prevent tenantId spoofing - ignore any tenantId in the update DTO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenantId, ...updateData } = dto;

    // Validate new client belongs to tenant (if provided)
    if (updateData.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: updateData.clientId,
          tenantId: userTenantId,
        },
        select: { id: true },
      });

      if (!client) {
        throw new ForbiddenException(
          'Client does not belong to the current tenant.',
        );
      }
    }

    // Validate new project belongs to tenant (if provided)
    if (updateData.projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: updateData.projectId,
          tenantId: userTenantId,
        },
        select: { id: true },
      });

      if (!project) {
        throw new ForbiddenException(
          'Project does not belong to the current tenant.',
        );
      }
    }

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
    if (updateData.currency) data.currency = updateData.currency.toUpperCase();

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data,
    });

    if (
      updateData.status === InvoiceStatus.CANCELLED &&
      oldInvoice.status !== InvoiceStatus.CANCELLED
    ) {
      if (oldInvoice.status !== InvoiceStatus.DRAFT) {
        try {
          const netAmount =
            oldInvoice.subtotal ??
            new Prisma.Decimal(oldInvoice.total).minus(
              oldInvoice.tax ? new Prisma.Decimal(oldInvoice.tax) : 0,
            );
          await this.glService.reverseInvoice(
            userTenantId,
            id,
            netAmount,
            oldInvoice.tax ?? 0,
            userId,
          );
        } catch (err) {
          void err;
        }
      }
    } else if (
      oldInvoice.status === InvoiceStatus.DRAFT &&
      updateData.status &&
      updateData.status !== InvoiceStatus.DRAFT &&
      updateData.status !== InvoiceStatus.CANCELLED
    ) {
      try {
        const netAmount =
          updatedInvoice.subtotal ??
          new Prisma.Decimal(updatedInvoice.total).minus(
            updatedInvoice.tax ? new Prisma.Decimal(updatedInvoice.tax) : 0,
          );
        await this.glService.postInvoice(
          userTenantId,
          id,
          netAmount,
          updatedInvoice.tax ?? 0,
          userId,
        );
      } catch (err) {
        void err;
      }
    }

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'INVOICE',
      description: `Invoice ${updatedInvoice.invoiceNumber} updated.`,
      userId,
      tenantId: userTenantId,
    });

    return updatedInvoice;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const invoice = await this.findOne(id, userTenantId);

    await this.prisma.invoice.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'INVOICE',
      description: `Invoice ${invoice.invoiceNumber} deleted.`,
      userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Invoice deleted successfully',
    };
  }
}
