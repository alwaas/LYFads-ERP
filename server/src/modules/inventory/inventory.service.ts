import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, StockMovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async getByProduct(productId: string, userTenantId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: {
        productId,
        tenantId: userTenantId,
      },
      include: {
        product: true,
      },
    });

    if (!inventory) {
      return null;
    }

    return inventory;
  }

  async getByTenant(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Prisma.InventoryWhereInput = {
      tenantId: userTenantId,
      ...(search.search && {
        product: {
          OR: [
            { name: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
            { sku: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          ],
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
              reorderLevel: true,
              status: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async getMovements(productId: string, userTenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId: userTenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return this.prisma.stockMovement.findMany({
      where: {
        productId,
        tenantId: userTenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adjustStock(
    productId: string,
    type: StockMovementType,
    quantity: number,
    note: string,
    userTenantId: string,
    userId?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId: userTenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot adjust stock for inactive product.');
    }

    if (quantity <= 0) {
      throw new BadRequestException('Adjustment quantity must be greater than zero.');
    }

    if (!note || note.trim().length === 0) {
      throw new BadRequestException('Note is required for stock adjustments.');
    }

    const updatedInventory = await this.prisma.$transaction(async (tx) => {
      let inventory = await tx.inventory.findFirst({
        where: { productId, tenantId: userTenantId },
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            productId,
            tenantId: userTenantId,
            quantity: new Prisma.Decimal(0),
            reservedQuantity: new Prisma.Decimal(0),
          },
        });
      }

      const currentQty = Number(inventory.quantity);
      let newQty = currentQty;

      if (type === StockMovementType.ADJUSTMENT_IN) {
        newQty = currentQty + quantity;
      } else if (type === StockMovementType.ADJUSTMENT_OUT) {
        newQty = currentQty - quantity;
        if (newQty < 0) {
          throw new BadRequestException('Insufficient stock for this adjustment.');
        }
      }

      const updated = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: new Prisma.Decimal(newQty) },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          tenantId: userTenantId,
          type,
          quantity: new Prisma.Decimal(quantity),
          note: note.trim(),
          createdById: userId,
        },
      });

      return updated;
    });

    await this.activityLogs.create({
      action: 'ADJUST',
      module: 'INVENTORY',
      description: `Stock adjusted for product "${product.name}" (${type}: ${quantity})`,
      userId,
      tenantId: userTenantId,
    });

    return updatedInventory;
  }

  async getStockStatus(productId: string, userTenantId: string) {
    const inventory = await this.getByProduct(productId, userTenantId);

    if (!inventory) {
      return {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        reorderLevel: null,
      };
    }

    const quantity = Number(inventory.quantity);
    const reorderLevel = inventory.product.reorderLevel
      ? Number(inventory.product.reorderLevel)
      : null;

    let status = 'IN_STOCK';
    if (quantity <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (reorderLevel !== null && quantity <= reorderLevel) {
      status = 'LOW_STOCK';
    }

    return {
      status,
      quantity,
      reorderLevel,
    };
  }
}
