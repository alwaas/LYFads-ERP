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
import { Prisma } from '@prisma/client';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStockMovementDto, userTenantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, tenantId: true, name: true, sku: true },
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
        const sourceStock = await tx.productWarehouse.findUnique({
          where: {
            productId_warehouseId: {
              productId: dto.productId,
              warehouseId: dto.sourceWarehouseId!,
            },
          },
        });

        const availableStock = sourceStock?.quantity ?? 0;

        if (availableStock < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock in source warehouse. Available: ${availableStock}, requested: ${dto.quantity}`,
          );
        }

        const [sourceUpdated, destinationUpdated] = await Promise.all([
          tx.productWarehouse.update({
            where: {
              productId_warehouseId: {
                 productId: dto.productId,
                 warehouseId: dto.sourceWarehouseId!,
              },
            },
            data: { quantity: { decrement: dto.quantity } },
          }),
          tx.productWarehouse.upsert({
            where: {
              productId_warehouseId: {
                 productId: dto.productId,
                 warehouseId: dto.destinationWarehouseId!,
              },
            },
            update: { quantity: { increment: dto.quantity } },
            create: {
              productId: dto.productId,
              warehouseId: dto.destinationWarehouseId!,
              quantity: dto.quantity,
              tenantId: userTenantId,
            },
          }),
        ]);

        const movement = await tx.stockMovement.create({
          data: {
            productId: dto.productId,
            sourceWarehouseId: dto.sourceWarehouseId,
            destinationWarehouseId: dto.destinationWarehouseId,
            type: MovementType.TRANSFER,
            quantity: dto.quantity,
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
      if (dto.type === MovementType.OUT || dto.type === MovementType.ADJUST) {
        const stock = await tx.productWarehouse.findUnique({
          where: {
            productId_warehouseId: {
              productId: dto.productId,
              warehouseId: dto.warehouseId!,
            },
          },
        });

        const availableStock = stock?.quantity ?? 0;

        if (dto.type === MovementType.OUT && availableStock < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${availableStock}, requested: ${dto.quantity}`,
          );
        }

        if (dto.type === MovementType.ADJUST) {
          const adjustedStock = availableStock + dto.quantity;
          if (adjustedStock < 0) {
            throw new BadRequestException(
              `Adjustment would result in negative stock. Current: ${availableStock}, adjustment: ${dto.quantity}`,
            );
          }
        }
      }

      const quantityDelta =
        dto.type === MovementType.OUT ? -dto.quantity : dto.quantity;

      const warehouseId = dto.warehouseId!;
      const [productWarehouse, product] = await Promise.all([
        tx.productWarehouse.upsert({
          where: {
            productId_warehouseId: {
              productId: dto.productId,
              warehouseId,
            },
          },
          update: { quantity: { increment: quantityDelta } },
          create: {
            productId: dto.productId,
            warehouseId,
            quantity: quantityDelta,
            tenantId: userTenantId,
          },
        }),
        tx.product.update({
          where: { id: dto.productId },
          data: {
            stockQuantity: {
              increment: quantityDelta,
            },
          },
        }),
      ]);

      const movement = await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          warehouseId,
          type: dto.type,
          quantity: dto.quantity,
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
