import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, SalesOrderStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrderQueryDto } from './dto/sales-order-query.dto';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateSalesOrderDto, userTenantId: string, userId?: string) {
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException('Cannot create sales order for a different tenant');
    }

    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId: userTenantId },
      select: { id: true, companyName: true },
    });

    if (!client) {
      throw new ForbiddenException('Client does not belong to the current tenant');
    }

    const existing = await this.prisma.salesOrder.findFirst({
      where: { orderNumber: dto.orderNumber, tenantId: userTenantId },
    });

    if (existing) {
      throw new ConflictException('Sales order number already exists for this tenant');
    }

    const salesOrder = await this.prisma.salesOrder.create({
      data: {
        orderNumber: dto.orderNumber,
        clientId: dto.clientId,
        orderDate: new Date(dto.orderDate),
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
        status: dto.status || SalesOrderStatus.DRAFT,
        subtotal: new Prisma.Decimal(dto.subtotal),
        discount: dto.discount ? new Prisma.Decimal(dto.discount) : undefined,
        tax: dto.tax ? new Prisma.Decimal(dto.tax) : undefined,
        total: new Prisma.Decimal(dto.total),
        notes: dto.notes,
        tenantId: userTenantId,
      },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'SALES_ORDER',
      description: `Sales order ${salesOrder.orderNumber} created.`,
      userId: userId,
      tenantId: userTenantId,
    });

    return salesOrder;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    query: SalesOrderQueryDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.SalesOrderWhereInput = { tenantId: userTenantId };

    if (search.search) {
      where.OR = [
        { orderNumber: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { notes: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { client: { companyName: { contains: search.search, mode: Prisma.QueryMode.insensitive } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.dateFrom || query.dateTo) {
      where.orderDate = {};
      if (query.dateFrom) {
        where.orderDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.orderDate.lte = new Date(query.dateTo);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { id: true, companyName: true, email: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { orderDate: 'desc' },
      }),
      this.prisma.salesOrder.count({ where }),
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
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales order not found');
    }

    if (salesOrder.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this sales order');
    }

    return salesOrder;
  }

  async update(id: string, dto: UpdateSalesOrderDto, userTenantId: string, userId?: string) {
    const salesOrder = await this.findOne(id, userTenantId);

    if (salesOrder.status === SalesOrderStatus.FULFILLED || salesOrder.status === SalesOrderStatus.CANCELLED) {
      throw new ConflictException('Cannot update a finalized or cancelled sales order');
    }

    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, tenantId: userTenantId },
        select: { id: true },
      });

      if (!client) {
        throw new ForbiddenException('Client does not belong to the current tenant');
      }
    }

    const data: Prisma.SalesOrderUpdateInput = {};

    if (dto.orderNumber !== undefined) data.orderNumber = dto.orderNumber;
    if (dto.clientId !== undefined) {
      data.client = { connect: { id: dto.clientId } };
    }
    if (dto.orderDate !== undefined) data.orderDate = new Date(dto.orderDate);
    if (dto.expectedDeliveryDate !== undefined)
      data.expectedDeliveryDate = dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.subtotal !== undefined) data.subtotal = new Prisma.Decimal(dto.subtotal);
    if (dto.discount !== undefined) data.discount = new Prisma.Decimal(dto.discount);
    if (dto.tax !== undefined) data.tax = new Prisma.Decimal(dto.tax);
    if (dto.total !== undefined) data.total = new Prisma.Decimal(dto.total);
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data,
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'SALES_ORDER',
      description: `Sales order ${updated.orderNumber} updated.`,
      userId: userId,
      tenantId: userTenantId,
    });

    return updated;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const salesOrder = await this.findOne(id, userTenantId);

    if (salesOrder.status === SalesOrderStatus.FULFILLED || salesOrder.status === SalesOrderStatus.PROCESSING) {
      throw new ConflictException('Cannot delete a processed or fulfilled sales order');
    }

    await this.prisma.salesOrder.delete({ where: { id } });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'SALES_ORDER',
      description: `Sales order ${salesOrder.orderNumber} deleted.`,
      userId: userId,
      tenantId: userTenantId,
    });

    return { success: true, message: 'Sales order deleted successfully' };
  }

  async updateStatus(id: string, status: SalesOrderStatus, userTenantId: string, userId?: string) {
    const salesOrder = await this.findOne(id, userTenantId);

    const validTransitions: Record<string, SalesOrderStatus[]> = {
      [SalesOrderStatus.DRAFT]: [SalesOrderStatus.CONFIRMED, SalesOrderStatus.CANCELLED],
      [SalesOrderStatus.CONFIRMED]: [SalesOrderStatus.PROCESSING, SalesOrderStatus.CANCELLED],
      [SalesOrderStatus.PROCESSING]: [SalesOrderStatus.FULFILLED, SalesOrderStatus.CANCELLED],
      [SalesOrderStatus.FULFILLED]: [],
      [SalesOrderStatus.CANCELLED]: [],
    };

    const currentStatus = salesOrder.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new ConflictException(`Invalid transition from ${currentStatus} to ${status}`);
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    await this.activityLogsService.log({
      action: 'STATUS_UPDATE',
      module: 'SALES_ORDER',
      description: `Sales order ${updated.orderNumber} status changed to ${status}.`,
      userId: userId,
      tenantId: userTenantId,
    });

    return updated;
  }
}
