import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MovementType, CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Prisma, StockMovementType } from '@prisma/client';
import { InventoryValuationService } from '../inventory-valuation/inventory-valuation.service';

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly valuation: InventoryValuationService,
  ) {}

  async create(dto: CreateStockMovementDto, userTenantId: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, tenantId: true, name: true, sku: true, costPrice: true },
    });

    if (!product || product.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this product');
    }

    if (dto.type === MovementType.TRANSFER) {
      if (!dto.sourceWarehouseId || !dto.destinationWarehouseId) {
        throw new BadRequestException(
          'sourceWarehouseId and destinationWarehouseId are required for transfers',
        );
      }

      if (dto.sourceWarehouseId === dto.destinationWarehouseId) {
        throw new BadRequestException(
          'Source and destination warehouses must be different',
        );
      }

      const [sourceWarehouse, destinationWarehouse] = await Promise.all([
        this.prisma.warehouse.findUnique({
          where: { id: dto.sourceWarehouseId },
          select: { id: true, tenantId: true },
        }),
        this.prisma.warehouse.findUnique({
          where: { id: dto.destinationWarehouseId },
          select: { id: true, tenantId: true },
        }),
      ]);

      if (
        !sourceWarehouse ||
        sourceWarehouse.tenantId !== userTenantId ||
        !destinationWarehouse ||
        destinationWarehouse.tenantId !== userTenantId
      ) {
        throw new ForbiddenException('Access denied to one or more warehouses');
      }

      return this.prisma.$transaction(async (tx) => {
        const method = await this.valuation.getTenantValuationMethod(userTenantId);

        const { totalCost, unitCost } = await this.valuation.applyMovement(
          tx,
          userTenantId,
          method,
          StockMovementType.TRANSFER,
          {
            productId: dto.productId,
            quantity: dto.quantity,
            sourceWarehouseId: dto.sourceWarehouseId,
            destinationWarehouseId: dto.destinationWarehouseId,
          },
        );

        // Update per-warehouse quantities (applyTransfer has already applied costing
        // but we still need to update the quantity columns in product_warehouses).
        const sourcePw = await tx.productWarehouse.findUnique({
          where: {
            productId_warehouseId: {
              productId: dto.productId,
              warehouseId: dto.sourceWarehouseId!,
            },
          },
        });
        const destPw = await tx.productWarehouse.findUnique({
          where: {
            productId_warehouseId: {
              productId: dto.productId,
              warehouseId: dto.destinationWarehouseId!,
            },
          },
        });

        if (!sourcePw || !destPw) {
          throw new BadRequestException('Source or destination product stock not found');
        }

        const [updatedSource, updatedDest] = await Promise.all([
          tx.productWarehouse.update({
            where: { id: sourcePw.id },
            data: { quantity: { decrement: dto.quantity } },
          }),
          tx.productWarehouse.update({
            where: { id: destPw.id },
            data: { quantity: { increment: dto.quantity } },
          }),
        ]);

        const movement = await tx.stockMovement.create({
          data: {
            productId: dto.productId,
            sourceWarehouseId: dto.sourceWarehouseId,
            destinationWarehouseId: dto.destinationWarehouseId,
            type: MovementType.TRANSFER,
            quantity: dto.quantity,
            unitCost: unitCost as unknown as Prisma.Decimal,
            totalCost: totalCost as unknown as Prisma.Decimal,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            notes: dto.notes,
            tenantId: userTenantId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            sourceWarehouse: { select: { id: true, name: true } },
            destinationWarehouse: { select: { id: true, name: true } },
          },
        });

        // Suppress unused var lint
        void updatedSource;
        void updatedDest;
        return movement;
      });
    }

    if (!dto.warehouseId) {
      throw new BadRequestException(
        'warehouseId is required for IN, OUT, and ADJUST movements',
      );
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
      select: { id: true, tenantId: true },
    });

    if (!warehouse || warehouse.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this warehouse');
    }

    return this.prisma.$transaction(async (tx) => {
      const method = await this.valuation.getTenantValuationMethod(userTenantId);

      // For ADJUST, allow signed adjustment. The DTO uses positive quantity and
      // we need to derive the sign from the requested stock direction.
      // Convention: ADJUST keeps the existing positive-quantity semantics. Users
      // can reconcile by setting new system stock via the physical-count endpoint.
      // For raw ADJUST (positive qty), we add stock.
      const movementType =
        dto.type === MovementType.OUT
          ? StockMovementType.OUT
          : dto.type === MovementType.ADJUST
            ? StockMovementType.ADJUST
            : StockMovementType.IN;

      const inboundUnitCost =
        movementType === StockMovementType.IN && dto.unitCost
          ? new Prisma.Decimal(dto.unitCost)
          : null;

      const { totalCost, unitCost } = await this.valuation.applyMovement(
        tx,
        userTenantId,
        method,
        movementType,
        {
          productId: dto.productId,
          quantity: dto.quantity,
          unitCostInput: inboundUnitCost,
          warehouseId: dto.warehouseId!,
        },
      );

      // Update the per-warehouse quantity column.
      const quantityDelta =
        movementType === StockMovementType.OUT ? -dto.quantity : dto.quantity;

      const productWarehouse = await tx.productWarehouse.upsert({
        where: {
          productId_warehouseId: {
            productId: dto.productId,
            warehouseId: dto.warehouseId!,
          },
        },
        update: { quantity: { increment: quantityDelta } },
        create: {
          productId: dto.productId,
          warehouseId: dto.warehouseId!,
          quantity: quantityDelta,
          tenantId: userTenantId,
        },
      });

      // Keep product aggregate stockQuantity in sync.
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: { increment: quantityDelta } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          type: dto.type,
          quantity: dto.quantity,
          unitCost: unitCost as unknown as Prisma.Decimal,
          totalCost: totalCost as unknown as Prisma.Decimal,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          notes: dto.notes,
          tenantId: userTenantId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
      });

      // Suppress unused var lint
      void productWarehouse;
      return movement;
    });
  }

  async findAll(search: SearchDto, query: StockMovementQueryDto, userTenantId: string) {
    const where: Prisma.StockMovementWhereInput = {
      tenantId: userTenantId,
    };

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.warehouseId) {
      where.warehouseId = query.warehouseId;
    }

    if (query.type) {
      where.type = query.type as MovementType;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    if (search.search) {
      where.OR = [
        { notes: { contains: search.search, mode: 'insensitive' } },
        { referenceType: { contains: search.search, mode: 'insensitive' } },
        { referenceId: { contains: search.search, mode: 'insensitive' } },
        { product: { name: { contains: search.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          sourceWarehouse: { select: { id: true, name: true } },
          destinationWarehouse: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
      },
    };
  }

  async findOne(id: string, userTenantId: string) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
      },
    });

    if (!movement) {
      throw new NotFoundException('Stock movement not found');
    }

    if (movement.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this stock movement');
    }

    return movement;
  }
}
