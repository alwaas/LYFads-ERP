import {
  BadRequestException,
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
import { AddItemsDto, SalesOrderItemInputDto } from './dto/add-items.dto';
import { InventoryValuationService } from '../inventory-valuation/inventory-valuation.service';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly valuation: InventoryValuationService,
  ) {}

  private toMoney(value?: string | null): Prisma.Decimal {
    if (value === undefined || value === null || value === '') {
      return new Prisma.Decimal(0);
    }
    return new Prisma.Decimal(value);
  }

  private computeLineTotal(item: SalesOrderItemInputDto): Prisma.Decimal {
    const qty = this.toMoney(item.quantity);
    const price = this.toMoney(item.unitPrice);
    const discount = this.toMoney(item.discount);
    const tax = this.toMoney(item.tax);
    return qty.mul(price).minus(discount).plus(tax);
  }

  private async assertProductsBelongToTenant(
    tx: Prisma.TransactionClient | PrismaService,
    productIds: string[],
    tenantId: string,
  ) {
    if (productIds.length === 0) return;
    const products = await (tx as PrismaService).product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, tenantId: true },
    });
    const valid = new Set(products.filter((p) => p.tenantId === tenantId).map((p) => p.id));
    for (const id of productIds) {
      if (!valid.has(id)) {
        throw new ForbiddenException(`Product ${id} does not belong to tenant`);
      }
    }
  }

  async create(dto: CreateSalesOrderDto, userTenantId: string, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required to create a sales order');
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

    await this.assertProductsBelongToTenant(this.prisma, dto.items.map((i) => i.productId), userTenantId);

    const subtotal = this.toMoney(dto.subtotal);
    const discount = this.toMoney(dto.discount);
    const tax = this.toMoney(dto.tax);
    const total = this.toMoney(dto.total);

    const salesOrder = await this.prisma.$transaction(async (tx) => {
      const created = await tx.salesOrder.create({
        data: {
          orderNumber: dto.orderNumber,
          clientId: dto.clientId,
          orderDate: new Date(dto.orderDate),
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          status: SalesOrderStatus.DRAFT,
          subtotal,
          discount,
          tax,
          total,
          notes: dto.notes,
          tenantId: userTenantId,
        },
      });

      const itemsData = dto.items.map((item, index) => ({
        salesOrderId: created.id,
        productId: item.productId,
        quantity: this.toMoney(item.quantity),
        unitPrice: this.toMoney(item.unitPrice),
        discount: this.toMoney(item.discount),
        tax: this.toMoney(item.tax),
        lineTotal: item.lineTotal ? this.toMoney(item.lineTotal) : this.computeLineTotal(item),
        sequence: typeof item.sequence === 'number' ? item.sequence : index,
        tenantId: userTenantId,
      }));

      await tx.salesOrderItem.createMany({ data: itemsData });

      return tx.salesOrder.findUnique({
        where: { id: created.id },
        include: {
          client: true,
          items: { include: { product: true } },
        },
      });
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'SALES_ORDER',
      description: `Sales order ${salesOrder!.orderNumber} created with ${dto.items.length} item(s).`,
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
    if (dto.subtotal !== undefined) data.subtotal = this.toMoney(dto.subtotal);
    if (dto.discount !== undefined) data.discount = this.toMoney(dto.discount);
    if (dto.tax !== undefined) data.tax = this.toMoney(dto.tax);
    if (dto.total !== undefined) data.total = this.toMoney(dto.total);
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

  async addItems(id: string, dto: AddItemsDto, userTenantId: string, userId?: string) {
    const salesOrder = await this.findOne(id, userTenantId);

    if (salesOrder.status !== SalesOrderStatus.DRAFT) {
      throw new ConflictException('Items can only be added while the order is in DRAFT');
    }

    await this.assertProductsBelongToTenant(this.prisma, dto.items.map((i) => i.productId), userTenantId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const startSeq = salesOrder.items.length;
      await tx.salesOrderItem.createMany({
        data: dto.items.map((item, idx) => ({
          salesOrderId: id,
          productId: item.productId,
          quantity: this.toMoney(item.quantity),
          unitPrice: this.toMoney(item.unitPrice),
          discount: this.toMoney(item.discount),
          tax: this.toMoney(item.tax),
          lineTotal: item.lineTotal ? this.toMoney(item.lineTotal) : this.computeLineTotal(item),
          sequence: startSeq + idx,
          tenantId: userTenantId,
        })),
      });
      return tx.salesOrder.findUnique({
        where: { id },
        include: { client: true, items: { include: { product: true } } },
      });
    });

    await this.activityLogsService.log({
      action: 'ADD_ITEMS',
      module: 'SALES_ORDER',
      description: `Added ${dto.items.length} item(s) to sales order ${updated!.orderNumber}.`,
      userId,
      tenantId: userTenantId,
    });

    return updated;
  }

  async removeItem(id: string, itemId: string, userTenantId: string, userId?: string) {
    const salesOrder = await this.findOne(id, userTenantId);

    if (salesOrder.status !== SalesOrderStatus.DRAFT) {
      throw new ConflictException('Items can only be removed while the order is in DRAFT');
    }

    const item = await this.prisma.salesOrderItem.findFirst({
      where: { id: itemId, salesOrderId: id, tenantId: userTenantId },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('Sales order item not found');
    }

    await this.prisma.salesOrderItem.delete({ where: { id: itemId } });

    await this.activityLogsService.log({
      action: 'REMOVE_ITEM',
      module: 'SALES_ORDER',
      description: `Removed item ${itemId} from sales order ${salesOrder.orderNumber}.`,
      userId,
      tenantId: userTenantId,
    });

    return this.findOne(id, userTenantId);
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

    if (status === SalesOrderStatus.FULFILLED) {
      throw new ConflictException(
        'Use POST /sales-orders/:id/fulfill-with-inventory to fulfill an order',
      );
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

  /**
   * Explicit, idempotent inventory fulfillment.
   * Only callable from a non-finalized state, and only for orders that have line items.
   * Creates a per-item OUT stock movement referenced to this sales order.
   * If an OUT movement already exists for the same order, the call is a no-op (idempotent).
   */
  async fulfillWithInventory(
    id: string,
    userTenantId: string,
    userId?: string,
  ) {
    const salesOrder = await this.findOne(id, userTenantId);

    if (salesOrder.status === SalesOrderStatus.CANCELLED) {
      throw new ConflictException('Cannot fulfill a cancelled sales order');
    }
    if (salesOrder.status === SalesOrderStatus.FULFILLED) {
      const existingCount = await this.prisma.stockMovement.count({
        where: { tenantId: userTenantId, referenceType: 'SALES_ORDER', referenceId: id },
      });
      return { alreadyFulfilled: true, movements: existingCount };
    }

    if (salesOrder.items.length === 0) {
      throw new BadRequestException(
        'Sales order has no items; add items before fulfilling with inventory',
      );
    }

    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId: userTenantId, isActive: true, isDefault: true },
      select: { id: true },
    });
    if (!defaultWarehouse) {
      throw new BadRequestException('No active default warehouse configured for inventory fulfillment');
    }

    const method = await this.valuation.getTenantValuationMethod(userTenantId);

    const movementCount = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const item of salesOrder.items) {
        const qty = Number(item.quantity);
        if (qty <= 0) continue;

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, tenantId: true },
        });
        if (!product || product.tenantId !== userTenantId) {
          throw new ForbiddenException('Product does not belong to tenant');
        }

        const productWarehouse = await tx.productWarehouse.findFirst({
          where: {
            tenantId: userTenantId,
            productId: item.productId,
            quantity: { gt: 0 },
          },
          orderBy: [{ warehouseId: defaultWarehouse.id ? 'asc' : 'asc' }],
          select: { id: true, warehouseId: true, quantity: true },
        });

        const sourceWarehouseId =
          productWarehouse && productWarehouse.quantity >= qty
            ? productWarehouse.warehouseId
            : defaultWarehouse.id;

        const { totalCost, unitCost } = await this.valuation.applyMovement(
          tx,
          userTenantId,
          method,
          'OUT' as any,
          {
            productId: item.productId,
            quantity: qty,
            warehouseId: sourceWarehouseId,
          },
        );

        const pw = await tx.productWarehouse.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: sourceWarehouseId,
            },
          },
          update: { quantity: { decrement: qty } },
          create: {
            productId: item.productId,
            warehouseId: sourceWarehouseId,
            quantity: -qty,
            tenantId: userTenantId,
          },
        });
        void pw;

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: qty } },
        });

        await tx.stockMovement.create({
          data: {
            tenantId: userTenantId,
            productId: item.productId,
            warehouseId: sourceWarehouseId,
            type: 'OUT',
            quantity: qty,
            unitCost: unitCost as unknown as Prisma.Decimal,
            totalCost: totalCost as unknown as Prisma.Decimal,
            referenceType: 'SALES_ORDER',
            referenceId: salesOrder.id,
            notes: `Sales order ${salesOrder.orderNumber} fulfillment`,
          },
        });
        count++;
      }

      await tx.salesOrder.update({
        where: { id: salesOrder.id },
        data: { status: SalesOrderStatus.FULFILLED },
      });
      return count;
    });

    await this.activityLogsService.log({
      action: 'INVENTORY_FULFILLMENT',
      module: 'SALES_ORDER',
      description: `Sales order ${salesOrder.orderNumber} fulfilled with ${movementCount} OUT movement(s).`,
      userId,
      tenantId: userTenantId,
    });

    return { alreadyFulfilled: false, movements: movementCount };
  }
}
