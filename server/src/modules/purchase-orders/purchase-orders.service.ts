import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { InventoryValuationService } from '../inventory-valuation/inventory-valuation.service';
import { GlService } from '../gl/gl.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly valuation: InventoryValuationService,
    private readonly glService: GlService,
  ) {}

  private toMoney(value?: string | null): Prisma.Decimal {
    if (value === undefined || value === null || value === '') {
      return new Prisma.Decimal(0);
    }
    return new Prisma.Decimal(value);
  }

  private computeLineTotal(
    quantity: string,
    unitCost: string,
    discount?: string,
    tax?: string,
  ): Prisma.Decimal {
    const qty = this.toMoney(quantity);
    const cost = this.toMoney(unitCost);
    const disc = this.toMoney(discount);
    const tx = this.toMoney(tax);
    return qty.mul(cost).minus(disc).plus(tx);
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

  async create(
    dto: CreatePurchaseOrderDto,
    userTenantId: string,
    userId?: string,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required to create a purchase order');
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, tenantId: userTenantId, isActive: true },
      select: { id: true },
    });
    if (!vendor) {
      throw new ForbiddenException(
        'Vendor does not belong to the current tenant or is inactive',
      );
    }

    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, tenantId: userTenantId, isActive: true },
        select: { id: true },
      });
      if (!warehouse) {
        throw new ForbiddenException('Warehouse does not belong to tenant or is inactive');
      }
    }

    await this.assertProductsBelongToTenant(this.prisma, dto.items.map((i) => i.productId), userTenantId);

    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { orderNumber: dto.orderNumber, tenantId: userTenantId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Purchase order number already exists for this tenant');
    }

    const subtotal = this.toMoney(dto.subtotal);
    const discount = this.toMoney(dto.discount);
    const tax = this.toMoney(dto.tax);
    const total = this.toMoney(dto.total);

    const created = await this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          orderNumber: dto.orderNumber,
          vendorId: dto.vendorId,
          warehouseId: dto.warehouseId || null,
          orderDate: new Date(dto.orderDate),
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          status: PurchaseOrderStatus.DRAFT,
          subtotal,
          discount,
          tax,
          total,
          notes: dto.notes,
          tenantId: userTenantId,
        },
      });

      const itemsData = dto.items.map((item, idx) => ({
        purchaseOrderId: po.id,
        productId: item.productId,
        quantity: this.toMoney(item.quantity),
        receivedQuantity: new Prisma.Decimal(0),
        unitCost: this.toMoney(item.unitCost),
        discount: this.toMoney(item.discount),
        tax: this.toMoney(item.tax),
        lineTotal: item.lineTotal
          ? this.toMoney(item.lineTotal)
          : this.computeLineTotal(item.quantity, item.unitCost, item.discount, item.tax),
        sequence: typeof item.sequence === 'number' ? item.sequence : idx,
        tenantId: userTenantId,
      }));

      await tx.purchaseOrderItem.createMany({ data: itemsData });

      return tx.purchaseOrder.findUnique({
        where: { id: po.id },
        include: {
          vendor: true,
          warehouse: true,
          items: { include: { product: true } },
        },
      });
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'PURCHASE_ORDER',
      description: `Purchase order ${created!.orderNumber} created with ${dto.items.length} item(s).`,
      userId,
      tenantId: userTenantId,
    });

    return created;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    query: PurchaseOrderQueryDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.PurchaseOrderWhereInput = { tenantId: userTenantId };

    if (search.search) {
      where.OR = [
        { orderNumber: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { notes: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { vendor: { name: { contains: search.search, mode: Prisma.QueryMode.insensitive } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.dateFrom || query.dateTo) {
      where.orderDate = {};
      if (query.dateFrom) where.orderDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.orderDate.lte = new Date(query.dateTo);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          warehouse: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { orderDate: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
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
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    if (po.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this purchase order');
    }
    return po;
  }

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    userTenantId: string,
    userId?: string,
  ) {
    const po = await this.findOne(id, userTenantId);

    if (
      po.status === PurchaseOrderStatus.RECEIVED ||
      po.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new ConflictException('Cannot update a finalized or cancelled purchase order');
    }

    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: dto.vendorId, tenantId: userTenantId, isActive: true },
        select: { id: true },
      });
      if (!vendor) {
        throw new ForbiddenException('Vendor does not belong to tenant or is inactive');
      }
    }

    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, tenantId: userTenantId, isActive: true },
        select: { id: true },
      });
      if (!warehouse) {
        throw new ForbiddenException('Warehouse does not belong to tenant or is inactive');
      }
    }

    const data: Prisma.PurchaseOrderUpdateInput = {};
    if (dto.orderNumber !== undefined) data.orderNumber = dto.orderNumber;
    if (dto.vendorId !== undefined) data.vendor = { connect: { id: dto.vendorId } };
    if (dto.warehouseId !== undefined) {
      data.warehouse = dto.warehouseId
        ? { connect: { id: dto.warehouseId } }
        : { disconnect: true };
    }
    if (dto.orderDate !== undefined) data.orderDate = new Date(dto.orderDate);
    if (dto.expectedDeliveryDate !== undefined) {
      data.expectedDeliveryDate = dto.expectedDeliveryDate
        ? new Date(dto.expectedDeliveryDate)
        : null;
    }
    if (dto.subtotal !== undefined) data.subtotal = this.toMoney(dto.subtotal);
    if (dto.discount !== undefined) data.discount = this.toMoney(dto.discount);
    if (dto.tax !== undefined) data.tax = this.toMoney(dto.tax);
    if (dto.total !== undefined) data.total = this.toMoney(dto.total);
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        vendor: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'PURCHASE_ORDER',
      description: `Purchase order ${updated.orderNumber} updated.`,
      userId,
      tenantId: userTenantId,
    });

    return updated;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const po = await this.findOne(id, userTenantId);

    if (
      po.status === PurchaseOrderStatus.RECEIVED ||
      po.status === PurchaseOrderStatus.APPROVED
    ) {
      throw new ConflictException('Cannot delete an approved or received purchase order');
    }

    await this.prisma.purchaseOrder.delete({ where: { id } });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'PURCHASE_ORDER',
      description: `Purchase order ${po.orderNumber} deleted.`,
      userId,
      tenantId: userTenantId,
    });

    return { success: true, message: 'Purchase order deleted successfully' };
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    userTenantId: string,
    userId?: string,
  ) {
    const po = await this.findOne(id, userTenantId);

    const validTransitions: Record<string, PurchaseOrderStatus[]> = {
      [PurchaseOrderStatus.DRAFT]: [
        PurchaseOrderStatus.SUBMITTED,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.SUBMITTED]: [
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.APPROVED]: [PurchaseOrderStatus.CANCELLED],
      [PurchaseOrderStatus.RECEIVED]: [],
      [PurchaseOrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[po.status]?.includes(status)) {
      throw new ConflictException(`Invalid transition from ${po.status} to ${status}`);
    }

    if (status === PurchaseOrderStatus.RECEIVED) {
      throw new ConflictException(
        'Use POST /purchase-orders/:id/receive to mark as received',
      );
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        vendor: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

    await this.activityLogsService.log({
      action: 'STATUS_UPDATE',
      module: 'PURCHASE_ORDER',
      description: `Purchase order ${updated.orderNumber} status changed to ${status}.`,
      userId,
      tenantId: userTenantId,
    });

    return updated;
  }

  /**
   * Receive stock against a purchase order.
   * - Authoritative inventory path: calls InventoryValuationService.applyMovement
   *   inside a Prisma $transaction, then increments per-warehouse quantity and
   *   product.stockQuantity, and creates a stock_movement (IN) referenced to the PO.
   * - Idempotency: existing IN movements for this PO short-circuit the operation.
   * - Over-receiving: each line item cannot receive more than (ordered - already received).
   * - Once all items are fully received, the PO is transitioned to RECEIVED.
   */
  async receive(
    id: string,
    dto: ReceivePurchaseOrderDto,
    userTenantId: string,
    userId?: string,
  ) {
    const po = await this.findOne(id, userTenantId);

    if (po.status === PurchaseOrderStatus.CANCELLED) {
      throw new ConflictException('Cannot receive a cancelled purchase order');
    }
    if (po.status === PurchaseOrderStatus.RECEIVED) {
      throw new ConflictException('Purchase order is already fully received');
    }
    if (
      po.status !== PurchaseOrderStatus.APPROVED &&
      po.status !== PurchaseOrderStatus.SUBMITTED
    ) {
      throw new ConflictException('Only SUBMITTED or APPROVED purchase orders can receive stock');
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, tenantId: userTenantId, isActive: true },
      select: { id: true, name: true },
    });
    if (!warehouse) {
      throw new ForbiddenException('Warehouse does not belong to tenant or is inactive');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required to receive');
    }

    const method = await this.valuation.getTenantValuationMethod(userTenantId);

    const itemIds = dto.items.map((i) => i.itemId);
    const existingItems = await this.prisma.purchaseOrderItem.findMany({
      where: { id: { in: itemIds }, purchaseOrderId: id, tenantId: userTenantId },
    });
    if (existingItems.length !== itemIds.length) {
      throw new NotFoundException('One or more line items do not belong to this purchase order');
    }

    // Pre-validate quantities
    for (const recv of dto.items) {
      const ei = existingItems.find((e) => e.id === recv.itemId)!;
      const qty = Number(recv.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new BadRequestException(`Invalid receive quantity for item ${recv.itemId}`);
      }
      const remaining = Number(ei.quantity) - Number(ei.receivedQuantity);
      if (qty > remaining + 0.0001) {
        throw new BadRequestException(
          `Over-receiving item ${recv.itemId}: remaining ${remaining.toFixed(2)}, requested ${qty}`,
        );
      }
    }

    const productIds = Array.from(new Set(existingItems.map((e) => e.productId)));
    await this.assertProductsBelongToTenant(this.prisma, productIds, userTenantId);

    const result = await this.prisma.$transaction(async (tx) => {
      let totalReceivedNow = 0;
      let allFullyReceived = true;

      const inventoryAccount = await tx.account.findUnique({
        where: { code_tenantId: { code: '1020', tenantId: userTenantId } },
      });
      const apAccount = await tx.account.findUnique({
        where: { code_tenantId: { code: '2000', tenantId: userTenantId } },
      });

      for (const recv of dto.items) {
        const ei = existingItems.find((e) => e.id === recv.itemId)!;
        const qty = Number(recv.quantity);
        totalReceivedNow += qty;

        const product = await tx.product.findUnique({
          where: { id: ei.productId },
          select: { id: true, tenantId: true, name: true, sku: true },
        });
        if (!product || product.tenantId !== userTenantId) {
          throw new ForbiddenException('Product does not belong to tenant');
        }

        const inboundUnitCost = ei.unitCost;

        const { totalCost, unitCost } = await this.valuation.applyMovement(
          tx,
          userTenantId,
          method,
          StockMovementType.IN,
          {
            productId: ei.productId,
            quantity: qty,
            unitCostInput: inboundUnitCost,
            warehouseId: warehouse.id,
            movementId: null,
          },
        );

        await tx.productWarehouse.upsert({
          where: {
            productId_warehouseId: {
              productId: ei.productId,
              warehouseId: warehouse.id,
            },
          },
          update: { quantity: { increment: qty } },
          create: {
            productId: ei.productId,
            warehouseId: warehouse.id,
            quantity: qty,
            tenantId: userTenantId,
            averageCost: inboundUnitCost,
          },
        });

        await tx.product.update({
          where: { id: ei.productId },
          data: { stockQuantity: { increment: qty } },
        });

        await tx.stockMovement.create({
          data: {
            tenantId: userTenantId,
            productId: ei.productId,
            warehouseId: warehouse.id,
            type: StockMovementType.IN,
            quantity: qty,
            unitCost: unitCost as unknown as Prisma.Decimal,
            totalCost: totalCost as unknown as Prisma.Decimal,
            referenceType: 'PURCHASE_ORDER',
            referenceId: po.id,
            notes: dto.notes ?? `Purchase order ${po.orderNumber} receipt`,
          },
        });

        await this.glService.createJournalEntryInTransaction(
          tx,
          {
            date: new Date(),
            description: `Inventory receipt for PO ${po.orderNumber} (product ${ei.productId})`,
            referenceId: `inventory_receipt_${po.id}_${ei.productId}`,
            posted: true,
            createdById: userId,
            lines: [
              { accountId: inventoryAccount!.id, debitAmount: totalCost },
              { accountId: apAccount!.id, creditAmount: totalCost },
            ],
          },
          userTenantId,
        );

        const newReceived = Number(ei.receivedQuantity) + qty;
        await tx.purchaseOrderItem.update({
          where: { id: ei.id },
          data: { receivedQuantity: new Prisma.Decimal(newReceived) },
        });
      }

      // Re-check whether all lines are now fully received
      const refreshed = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
        select: { quantity: true, receivedQuantity: true },
      });
      for (const r of refreshed) {
        if (Number(r.receivedQuantity) < Number(r.quantity) - 0.0001) {
          allFullyReceived = false;
          break;
        }
      }

      let finalStatus = po.status;
      if (allFullyReceived) {
        await tx.purchaseOrder.update({
          where: { id },
          data: { status: PurchaseOrderStatus.RECEIVED },
        });
        finalStatus = PurchaseOrderStatus.RECEIVED;
      }

      return { totalReceivedNow, finalStatus };
    });

    await this.activityLogsService.log({
      action: 'INVENTORY_RECEIPT',
      module: 'PURCHASE_ORDER',
      description: `Purchase order ${po.orderNumber} received ${result.totalReceivedNow} units across ${dto.items.length} item(s).`,
      userId,
      tenantId: userTenantId,
    });

    return this.findOne(id, userTenantId);
  }
}
