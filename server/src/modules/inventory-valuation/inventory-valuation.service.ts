import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InventoryValuationMethod, StockMovementType } from '@prisma/client';

export interface ConsumptionResult {
  totalQuantity: number;
  totalCost: Prisma.Decimal;
  unitCost: Prisma.Decimal; // weighted average unit cost actually consumed
}

export interface LayerConsumptionEntry {
  layerId: string;
  quantity: number;
  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
}

/**
 * Authoritative inventory valuation service.
 *
 * Supports two tenant-configured methods:
 *
 *   FIFO:
 *     - Inbound IN / ADJUST (positive) creates a FifoCostLayer (one per inbound).
 *     - Outbound OUT / ADJUST (negative) consumes layers oldest-first (receivedAt asc).
 *     - TRANSFER is modeled as an OUT from source (consume layers) + IN to destination
 *       (create new layer at the source-consumed unit cost, preserving cost basis).
 *     - Layer consumption is partial-friendly: remainingQuantity is decremented atomically.
 *     - valuation = sum(remainingQuantity * unitCost) over active layers.
 *
 *   WEIGHTED_AVERAGE:
 *     - Per (productId, warehouseId) snapshot stored on product_warehouses.averageCost.
 *     - IN:   newAverageCost = (currentQty * currentAvg + inboundQty * inboundCost) / (currentQty + inboundQty)
 *     - OUT:  unitCost consumed = product_warehouses.averageCost at the time of consumption.
 *     - TRANSFER: OUT from source (consume source avg) + IN to destination
 *                (compute new average using destination's current qty and avg).
 *     - Zero-stock transitions are handled safely: if qty becomes 0, averageCost resets to 0.
 *     - valuation = product_warehouses.quantity * product_warehouses.averageCost
 */
@Injectable()
export class InventoryValuationService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantValuationMethod(tenantId: string): Promise<InventoryValuationMethod> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { inventoryValuationMethod: true },
    });
    return tenant?.inventoryValuationMethod ?? InventoryValuationMethod.WEIGHTED_AVERAGE;
  }

  /**
   * Apply authoritative valuation for a stock movement inside a Prisma transaction.
   *
   * This MUST be called from inside a $transaction.
   *
   * @param tx Prisma transaction client
   * @param tenantId The tenant owning the movement
   * @param method Valuation method (FIFO or WEIGHTED_AVERAGE)
   * @param movementType IN | OUT | ADJUST | TRANSFER
   * @param params Movement parameters
   * @returns totalCost and unitCost applied (for movement record + COGS computation)
   */
  async applyMovement(
    tx: Prisma.TransactionClient,
    tenantId: string,
    method: InventoryValuationMethod,
    movementType: StockMovementType,
    params: {
      productId: string;
      quantity: number;
      unitCostInput?: Prisma.Decimal | null;
      warehouseId?: string | null;
      sourceWarehouseId?: string | null;
      destinationWarehouseId?: string | null;
      movementId?: string | null;
    },
  ): Promise<{ totalCost: Prisma.Decimal; unitCost: Prisma.Decimal }> {
    if (movementType === StockMovementType.TRANSFER) {
      return this.applyTransfer(tx, tenantId, method, params);
    }

    if (!params.warehouseId) {
      throw new Error('warehouseId is required for non-transfer movements');
    }

    const productWarehouse = await this.getOrCreateProductWarehouse(
      tx,
      tenantId,
      params.productId,
      params.warehouseId,
    );

    if (movementType === StockMovementType.IN) {
      const inboundUnitCost =
        params.unitCostInput && params.unitCostInput.gt(0)
          ? params.unitCostInput
          : new Prisma.Decimal(0);

      if (method === InventoryValuationMethod.FIFO) {
        // Create a new FIFO layer for this inbound.
        await tx.fifoCostLayer.create({
          data: {
            tenantId,
            productId: params.productId,
            warehouseId: params.warehouseId,
            productWarehouseId: productWarehouse.id,
            remainingQuantity: params.quantity,
            unitCost: inboundUnitCost,
            sourceMovementId: params.movementId ?? null,
          },
        });
      } else {
        // Weighted average update.
        const currentQty = productWarehouse.quantity;
        const currentAvg = productWarehouse.averageCost;
        const newQty = currentQty + params.quantity;
        const newAvg =
          newQty > 0
            ? currentAvg.mul(currentQty).plus(inboundUnitCost.mul(params.quantity)).div(newQty)
            : new Prisma.Decimal(0);

        await tx.productWarehouse.update({
          where: { id: productWarehouse.id },
          data: { averageCost: newAvg },
        });
      }

      const totalCost = inboundUnitCost.mul(params.quantity);
      return { totalCost, unitCost: inboundUnitCost };
    }

    if (movementType === StockMovementType.OUT) {
      return this.applyOutbound(tx, tenantId, method, productWarehouse, {
        productId: params.productId,
        quantity: params.quantity,
        warehouseId: params.warehouseId!,
      });
    }

    if (movementType === StockMovementType.ADJUST) {
      return this.applyAdjust(tx, tenantId, method, productWarehouse, {
        productId: params.productId,
        quantity: params.quantity,
        warehouseId: params.warehouseId!,
      });
    }

    throw new Error(`Unsupported movement type: ${movementType}`);
  }

  /**
   * Apply a TRANSFER: OUT from source + IN to destination atomically.
   * Cost basis is preserved — the consumed cost becomes the inbound cost of the destination.
   */
  private async applyTransfer(
    tx: Prisma.TransactionClient,
    tenantId: string,
    method: InventoryValuationMethod,
    params: {
      productId: string;
      quantity: number;
      sourceWarehouseId?: string | null;
      destinationWarehouseId?: string | null;
    },
  ): Promise<{ totalCost: Prisma.Decimal; unitCost: Prisma.Decimal }> {
    if (!params.sourceWarehouseId || !params.destinationWarehouseId) {
      throw new Error('TRANSFER requires both sourceWarehouseId and destinationWarehouseId');
    }
    if (params.sourceWarehouseId === params.destinationWarehouseId) {
      throw new Error('TRANSFER source and destination must be different');
    }

    const sourcePw = await this.getOrCreateProductWarehouse(
      tx,
      tenantId,
      params.productId,
      params.sourceWarehouseId,
    );
    const destPw = await this.getOrCreateProductWarehouse(
      tx,
      tenantId,
      params.productId,
      params.destinationWarehouseId,
    );

    if (sourcePw.quantity < params.quantity) {
      throw new BadRequestException(
        `Insufficient stock in source warehouse. Available: ${sourcePw.quantity}, requested: ${params.quantity}`,
      );
    }

    // OUT from source — consume cost.
    const out = await this.applyOutbound(tx, tenantId, method, sourcePw, {
      productId: params.productId,
      quantity: params.quantity,
      warehouseId: params.sourceWarehouseId,
    });

    // IN to destination — use the consumed unit cost as inbound cost (preserves basis).
    if (method === InventoryValuationMethod.FIFO) {
      await tx.fifoCostLayer.create({
        data: {
          tenantId,
          productId: params.productId,
          warehouseId: params.destinationWarehouseId,
          productWarehouseId: destPw.id,
          remainingQuantity: params.quantity,
          unitCost: out.unitCost,
        },
      });
    } else {
      const destQty = destPw.quantity;
      const destAvg = destPw.averageCost;
      const newQty = destQty + params.quantity;
      const newAvg =
        newQty > 0
          ? destAvg.mul(destQty).plus(out.unitCost.mul(params.quantity)).div(newQty)
          : new Prisma.Decimal(0);
      await tx.productWarehouse.update({
        where: { id: destPw.id },
        data: { averageCost: newAvg },
      });
    }

    return { totalCost: out.totalCost, unitCost: out.unitCost };
  }

  private async applyOutbound(
    tx: Prisma.TransactionClient,
    tenantId: string,
    method: InventoryValuationMethod,
    productWarehouse: { id: string; quantity: number; averageCost: Prisma.Decimal },
    params: { productId: string; quantity: number; warehouseId: string },
  ): Promise<{ totalCost: Prisma.Decimal; unitCost: Prisma.Decimal }> {
    if (productWarehouse.quantity < params.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${productWarehouse.quantity}, requested: ${params.quantity}`,
      );
    }

    if (method === InventoryValuationMethod.FIFO) {
      // Consume layers oldest-first.
      const layers = await tx.fifoCostLayer.findMany({
        where: {
          tenantId,
          productWarehouseId: productWarehouse.id,
          remainingQuantity: { gt: 0 },
        },
        orderBy: { receivedAt: 'asc' },
      });

      let remaining = params.quantity;
      let totalCost = new Prisma.Decimal(0);
      const consumed: LayerConsumptionEntry[] = [];

      for (const layer of layers) {
        if (remaining <= 0) break;
        const take = Math.min(layer.remainingQuantity, remaining);
        const layerCost = layer.unitCost.mul(take);
        totalCost = totalCost.plus(layerCost);

        await tx.fifoCostLayer.update({
          where: { id: layer.id },
          data: { remainingQuantity: layer.remainingQuantity - take },
        });

        consumed.push({
          layerId: layer.id,
          quantity: take,
          unitCost: layer.unitCost,
          totalCost: layerCost,
        });
        remaining -= take;
      }

      if (remaining > 0) {
        throw new BadRequestException(
          `FIFO layer shortage for product ${params.productId} in warehouse ${params.warehouseId}. Short by ${remaining} units.`,
        );
      }

      const unitCost = params.quantity > 0 ? totalCost.div(params.quantity) : new Prisma.Decimal(0);
      return { totalCost, unitCost };
    }

    // Weighted Average
    const unitCost = productWarehouse.averageCost;
    const totalCost = unitCost.mul(params.quantity);
    return { totalCost, unitCost };
  }

  private async applyAdjust(
    tx: Prisma.TransactionClient,
    tenantId: string,
    method: InventoryValuationMethod,
    productWarehouse: { id: string; quantity: number; averageCost: Prisma.Decimal },
    params: {
      productId: string;
      quantity: number; // signed: positive to add, negative to remove
      warehouseId: string;
    },
  ): Promise<{ totalCost: Prisma.Decimal; unitCost: Prisma.Decimal }> {
    const newQty = productWarehouse.quantity + params.quantity;
    if (newQty < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative stock. Current: ${productWarehouse.quantity}, adjustment: ${params.quantity}`,
      );
    }

    if (params.quantity > 0) {
      // Positive adjust: treat as inbound at current average (if no explicit unit cost).
      const inboundUnitCost = productWarehouse.averageCost.gt(0)
        ? productWarehouse.averageCost
        : new Prisma.Decimal(0);

      if (method === InventoryValuationMethod.FIFO) {
        await tx.fifoCostLayer.create({
          data: {
            tenantId,
            productId: params.productId,
            warehouseId: params.warehouseId,
            productWarehouseId: productWarehouse.id,
            remainingQuantity: params.quantity,
            unitCost: inboundUnitCost,
          },
        });
      } else {
        const currentQty = productWarehouse.quantity;
        const currentAvg = productWarehouse.averageCost;
        const updatedQty = currentQty + params.quantity;
        const newAvg =
          updatedQty > 0
            ? currentAvg.mul(currentQty).plus(inboundUnitCost.mul(params.quantity)).div(updatedQty)
            : new Prisma.Decimal(0);
        await tx.productWarehouse.update({
          where: { id: productWarehouse.id },
          data: { averageCost: newAvg },
        });
      }

      const totalCost = inboundUnitCost.mul(params.quantity);
      return { totalCost, unitCost: inboundUnitCost };
    }

    // Negative adjust: consume.
    if (params.quantity < 0) {
      return this.applyOutbound(tx, tenantId, method, productWarehouse, {
        productId: params.productId,
        quantity: -params.quantity,
        warehouseId: params.warehouseId,
      });
    }

    return { totalCost: new Prisma.Decimal(0), unitCost: new Prisma.Decimal(0) };
  }

  /**
   * Compute authoritative inventory value for a tenant using the configured method.
   * Returns the total cost value of all on-hand stock.
   */
  async computeInventoryValue(
    tenantId: string,
  ): Promise<{ method: InventoryValuationMethod; totalValue: Prisma.Decimal }> {
    const method = await this.getTenantValuationMethod(tenantId);

    if (method === InventoryValuationMethod.FIFO) {
      const layers = await this.prisma.fifoCostLayer.findMany({
        where: { tenantId, remainingQuantity: { gt: 0 } },
        select: { remainingQuantity: true, unitCost: true },
      });
      const total = layers.reduce(
        (acc, l) => acc.plus(l.unitCost.mul(l.remainingQuantity)),
        new Prisma.Decimal(0),
      );
      return { method, totalValue: total };
    }

    // Weighted average
    const rows = await this.prisma.productWarehouse.findMany({
      where: { tenantId, quantity: { gt: 0 } },
      select: { quantity: true, averageCost: true },
    });
    const total = rows.reduce(
      (acc, r) => acc.plus(r.averageCost.mul(r.quantity)),
      new Prisma.Decimal(0),
    );
    return { method, totalValue: total };
  }

  /**
   * Compute authoritative COGS over an optional date range.
   * Only OUT movements contribute to COGS, including those created from sales order fulfillment.
   */
  async computeCogs(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ method: InventoryValuationMethod; totalCogs: Prisma.Decimal; breakdown: Array<{ productId: string; totalCogs: Prisma.Decimal }> }> {
    const method = await this.getTenantValuationMethod(tenantId);
    const where: Prisma.StockMovementWhereInput = {
      tenantId,
      type: StockMovementType.OUT,
    };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      select: { productId: true, totalCost: true, quantity: true },
    });

    const byProduct = new Map<string, Prisma.Decimal>();
    let totalCogs = new Prisma.Decimal(0);
    for (const m of movements) {
      const cost = m.totalCost ?? new Prisma.Decimal(0);
      totalCogs = totalCogs.plus(cost);
      byProduct.set(
        m.productId,
        (byProduct.get(m.productId) ?? new Prisma.Decimal(0)).plus(cost),
      );
    }

    return {
      method,
      totalCogs,
      breakdown: Array.from(byProduct.entries()).map(([productId, totalCogs]) => ({
        productId,
        totalCogs,
      })),
    };
  }

  private async getOrCreateProductWarehouse(
    tx: Prisma.TransactionClient,
    tenantId: string,
    productId: string,
    warehouseId: string,
  ): Promise<{ id: string; quantity: number; averageCost: Prisma.Decimal }> {
    const existing = await tx.productWarehouse.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    if (existing) {
      return {
        id: existing.id,
        quantity: existing.quantity,
        averageCost: existing.averageCost,
      };
    }
    const created = await tx.productWarehouse.create({
      data: {
        tenantId,
        productId,
        warehouseId,
        quantity: 0,
        averageCost: new Prisma.Decimal(0),
      },
    });
    return {
      id: created.id,
      quantity: created.quantity,
      averageCost: created.averageCost,
    };
  }
}
