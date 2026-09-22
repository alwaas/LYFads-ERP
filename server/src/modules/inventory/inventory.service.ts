import {
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
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: userTenantId,
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      tenantId: product.tenantId,
      productId: product.id,
      quantity: product.stockQuantity,
      reservedQuantity: 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        reorderLevel: product.minStockLevel,
        status: product.isActive ? 'ACTIVE' : 'INACTIVE',
      },
    };
  }

  async getByTenant(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Prisma.ProductWhereInput = {
      tenantId: userTenantId,
      ...(search?.search && {
        OR: [
          { name: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          { sku: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = products.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      productId: p.id,
      quantity: p.stockQuantity,
      reservedQuantity: 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      product: {
        id: p.id,
        sku: p.sku,
        name: p.name,
        reorderLevel: p.minStockLevel,
        status: p.isActive ? 'ACTIVE' : 'INACTIVE',
      },
    }));

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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStockStatus(productId: string, userTenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId: userTenantId },
    });

    if (!product) {
      return {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        reorderLevel: null,
      };
    }

    const quantity = product.stockQuantity;
    const reorderLevel = product.minStockLevel;

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

  async adjustStock(
    productId: string,
    type: string | StockMovementType,
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

    if (!product.isActive) {
      throw new BadRequestException('Cannot adjust stock for inactive product.');
    }

    if (quantity <= 0) {
      throw new BadRequestException('Adjustment quantity must be greater than zero.');
    }

    if (!note || note.trim().length === 0) {
      throw new BadRequestException('Note is required for stock adjustments.');
    }

    const updatedProduct = await this.prisma.$transaction(async (tx) => {
      const currentQty = product.stockQuantity;
      let newQty = currentQty;
      let movementType: StockMovementType = StockMovementType.ADJUST;

      if (type === 'ADJUSTMENT_IN' || type === StockMovementType.IN) {
        newQty = currentQty + quantity;
        movementType = StockMovementType.IN;
      } else if (type === 'ADJUSTMENT_OUT' || type === StockMovementType.OUT) {
        newQty = currentQty - quantity;
        movementType = StockMovementType.OUT;
        if (newQty < 0) {
          throw new BadRequestException('Insufficient stock for this adjustment.');
        }
      } else {
        newQty = quantity;
        movementType = StockMovementType.ADJUST;
      }

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: newQty },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          tenantId: userTenantId,
          type: movementType,
          quantity,
          notes: note.trim(),
        },
      });

      return updated;
    });

    await this.activityLogs.log({
      action: 'ADJUST',
      module: 'INVENTORY',
      description: `Stock adjusted for product "${product.name}" (${type}: ${quantity})`,
      userId,
      tenantId: userTenantId,
    });

    return {
      id: updatedProduct.id,
      tenantId: updatedProduct.tenantId,
      productId: updatedProduct.id,
      quantity: updatedProduct.stockQuantity,
      reservedQuantity: 0,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
      product: {
        id: updatedProduct.id,
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        reorderLevel: updatedProduct.minStockLevel,
        status: updatedProduct.isActive ? 'ACTIVE' : 'INACTIVE',
      },
    };
  }
}
