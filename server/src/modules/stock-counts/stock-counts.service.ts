import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InventoryValuationService } from '../inventory-valuation/inventory-valuation.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { GlService } from '../gl/gl.service';

export interface CreateStockCountLineInput {
  productId: string;
  countedQuantity: number;
  notes?: string;
}

export interface CreateStockCountInput {
  warehouseId: string;
  countDate?: Date;
  notes?: string;
  lines: CreateStockCountLineInput[];
}

@Injectable()
export class StockCountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly valuation: InventoryValuationService,
    private readonly activityLogs: ActivityLogsService,
    private readonly glService: GlService,
  ) {}

  async createDraft(dto: CreateStockCountInput, tenantId: string) {
    if (!dto.lines?.length) {
      throw new BadRequestException('At least one line is required');
    }
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
      select: { id: true, tenantId: true },
    });
    if (!warehouse || warehouse.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this warehouse');
    }

    const draft = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockCount.create({
        data: {
          tenantId,
          warehouseId: dto.warehouseId,
          countDate: dto.countDate ?? new Date(),
          status: 'DRAFT',
          notes: dto.notes,
          lines: {
            create: dto.lines.map((l) => ({
              tenantId,
              productId: l.productId,
              countedQuantity: l.countedQuantity,
              notes: l.notes,
            })),
          },
        },
        include: { lines: true },
      });
      return created;
    });

    await this.activityLogs.log({
      action: 'STOCK_COUNT_DRAFT',
      module: 'INVENTORY',
      description: `Stock count draft created for warehouse ${dto.warehouseId} (${draft.lines.length} lines).`,
      tenantId,
    });

    return draft;
  }

  async findAll(tenantId: string) {
    return this.prisma.stockCount.findMany({
      where: { tenantId },
      include: { lines: true, warehouse: { select: { id: true, name: true } } },
      orderBy: { countDate: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const sc = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { lines: true, warehouse: { select: { id: true, name: true } } },
    });
    if (!sc) throw new NotFoundException('Stock count not found');
    if (sc.tenantId !== tenantId) throw new ForbiddenException('Access denied');
    return sc;
  }

  /**
   * Approve a stock count: compute variance vs system and create ADJUST movements for each line.
   * Idempotency: rejected if already APPROVED.
   */
  async approve(id: string, tenantId: string, userId?: string) {
    const sc = await this.findOne(id, tenantId);
    if (sc.status === 'APPROVED') {
      return { alreadyApproved: true, adjustmentMovements: 0 };
    }
    if (sc.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT stock counts can be approved');
    }

    const method = await this.valuation.getTenantValuationMethod(tenantId);

    const result = await this.prisma.$transaction(async (tx) => {
      let adjustmentCount = 0;
      let totalVarianceValue = new Prisma.Decimal(0);

      for (const line of sc.lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: { id: true, tenantId: true },
        });
        if (!product || product.tenantId !== tenantId) {
          throw new ForbiddenException('Product does not belong to tenant');
        }

        const pw = await tx.productWarehouse.findUnique({
          where: {
            productId_warehouseId: {
              productId: line.productId,
              warehouseId: sc.warehouseId,
            },
          },
        });
        const systemQty = pw?.quantity ?? 0;
        const variance = line.countedQuantity - systemQty;

        await tx.stockCountLine.update({
          where: { id: line.id },
          data: { systemQuantity: systemQty, variance },
        });

        if (variance === 0) continue;

        if (variance > 0) {
          // Inbound to add missing stock. Use the existing per-warehouse average cost
          // (or product cost price as fallback) for valuation.
          const inboundUnitCost = pw?.averageCost && pw.averageCost.gt(0)
            ? pw.averageCost
            : new Prisma.Decimal(0);

          const { totalCost, unitCost } = await this.valuation.applyMovement(
            tx,
            tenantId,
            method,
            'ADJUST' as any,
            {
              productId: line.productId,
              quantity: variance,
              warehouseId: sc.warehouseId,
              unitCostInput: inboundUnitCost,
            },
          );

          await tx.productWarehouse.upsert({
            where: {
              productId_warehouseId: {
                productId: line.productId,
                warehouseId: sc.warehouseId,
              },
            },
            update: { quantity: { increment: variance } },
            create: {
              productId: line.productId,
              warehouseId: sc.warehouseId,
              quantity: variance,
              tenantId,
            },
          });
          await tx.product.update({
            where: { id: line.productId },
            data: { stockQuantity: { increment: variance } },
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: line.productId,
              warehouseId: sc.warehouseId,
              type: 'ADJUST',
              quantity: variance,
              unitCost: unitCost as unknown as Prisma.Decimal,
              totalCost: totalCost as unknown as Prisma.Decimal,
              referenceType: 'STOCK_COUNT',
              referenceId: sc.id,
              notes: `Stock count ${sc.id} reconciliation (positive variance)`,
            },
          });
          if (new Prisma.Decimal(totalCost).gt(0)) {
            await this.glService.postInventoryAdjustmentInTransaction(
              tx,
              tenantId,
              sc.id,
              line.id,
              variance,
              totalCost,
              userId,
            );
          }
          totalVarianceValue = totalVarianceValue.plus(totalCost);
        } else {
          const { totalCost, unitCost } = await this.valuation.applyMovement(
            tx,
            tenantId,
            method,
            'ADJUST' as any,
            {
              productId: line.productId,
              quantity: variance, // negative
              warehouseId: sc.warehouseId,
            },
          );

          await tx.productWarehouse.update({
            where: {
              productId_warehouseId: {
                productId: line.productId,
                warehouseId: sc.warehouseId,
              },
            },
            data: { quantity: { increment: variance } },
          });
          await tx.product.update({
            where: { id: line.productId },
            data: { stockQuantity: { increment: variance } },
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: line.productId,
              warehouseId: sc.warehouseId,
              type: 'ADJUST',
              quantity: variance,
              unitCost: unitCost as unknown as Prisma.Decimal,
              totalCost: totalCost as unknown as Prisma.Decimal,
              referenceType: 'STOCK_COUNT',
              referenceId: sc.id,
              notes: `Stock count ${sc.id} reconciliation (negative variance)`,
            },
          });
          if (new Prisma.Decimal(totalCost).abs().gt(0)) {
            await this.glService.postInventoryAdjustmentInTransaction(
              tx,
              tenantId,
              sc.id,
              line.id,
              variance,
              totalCost,
              userId,
            );
          }
          totalVarianceValue = totalVarianceValue.plus(totalCost);
        }
        adjustmentCount++;
      }

      await tx.stockCount.update({
        where: { id: sc.id },
        data: { status: 'APPROVED' },
      });

      return { adjustmentCount, totalVarianceValue: totalVarianceValue.toString() };
    });

    await this.activityLogs.log({
      action: 'STOCK_COUNT_APPROVE',
      module: 'INVENTORY',
      description: `Stock count ${sc.id} approved (${result.adjustmentCount} adjustment(s)).`,
      userId,
      tenantId,
    });

    return { alreadyApproved: false, ...result };
  }
}
