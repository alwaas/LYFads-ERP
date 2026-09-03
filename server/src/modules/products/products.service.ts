import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Prisma, StockMovementType } from '@prisma/client';
import { InventoryValuationService } from '../inventory-valuation/inventory-valuation.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly valuation: InventoryValuationService,
  ) {}

  async create(dto: CreateProductDto, userTenantId: string) {
    const existing = await this.prisma.product.findFirst({
      where: {
        sku: dto.sku,
        tenantId: userTenantId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A product with this SKU already exists in your organization.',
      );
    }

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: dto.sku,
          name: dto.name,
          description: dto.description,
          unitPrice: new Prisma.Decimal(dto.unitPrice),
          costPrice: new Prisma.Decimal(dto.costPrice),
          stockQuantity: dto.stockQuantity ?? 0,
          minStockLevel: dto.minStockLevel ?? 0,
          isActive: dto.isActive ?? true,
          tenantId: userTenantId,
        },
      });

      // If a default warehouse exists and an initial stockQuantity is provided,
      // seed the per-warehouse stock and valuation layer so reports and COGS are consistent.
      const initialQty = dto.stockQuantity ?? 0;
      if (initialQty > 0) {
        const defaultWarehouse = await tx.warehouse.findFirst({
          where: { tenantId: userTenantId, isDefault: true, isActive: true },
          select: { id: true },
        });
        if (defaultWarehouse) {
          const method = await this.valuation.getTenantValuationMethod(userTenantId);
          const { totalCost, unitCost } = await this.valuation.applyMovement(
            tx,
            userTenantId,
            method,
            StockMovementType.IN,
            {
              productId: created.id,
              quantity: initialQty,
              unitCostInput: new Prisma.Decimal(dto.costPrice),
              warehouseId: defaultWarehouse.id,
            },
          );
          const pw = await tx.productWarehouse.upsert({
            where: {
              productId_warehouseId: {
                productId: created.id,
                warehouseId: defaultWarehouse.id,
              },
            },
            update: { quantity: { increment: initialQty } },
            create: {
              productId: created.id,
              warehouseId: defaultWarehouse.id,
              quantity: initialQty,
              tenantId: userTenantId,
            },
          });
          await tx.stockMovement.create({
            data: {
              productId: created.id,
              warehouseId: defaultWarehouse.id,
              type: StockMovementType.IN,
              quantity: initialQty,
              unitCost: unitCost as unknown as Prisma.Decimal,
              totalCost: totalCost as unknown as Prisma.Decimal,
              referenceType: 'INITIAL_STOCK',
              notes: 'Initial stock on product creation',
              tenantId: userTenantId,
            },
          });
          void pw;
        }
      }

      return created;
    });

    return product;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    query: ProductQueryDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.ProductWhereInput = {
      tenantId: userTenantId,
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    if (search.search) {
      where.OR = [
        { sku: { contains: search.search, mode: 'insensitive' } },
        { name: { contains: search.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userTenantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        warehouseStocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                location: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            stockMovements: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this product');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, userTenantId: string) {
    const product = await this.findOne(id, userTenantId);

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.prisma.product.findFirst({
        where: {
          sku: dto.sku,
          tenantId: userTenantId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'A product with this SKU already exists in your organization.',
        );
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        unitPrice: dto.unitPrice !== undefined ? new Prisma.Decimal(dto.unitPrice) : undefined,
        costPrice: dto.costPrice !== undefined ? new Prisma.Decimal(dto.costPrice) : undefined,
        minStockLevel: dto.minStockLevel,
        isActive: dto.isActive,
      },
      include: {
        warehouseStocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                location: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: { stockMovements: true },
        },
      },
    });

    return updated;
  }

  async remove(id: string, userTenantId: string) {
    const product = await this.findOne(id, userTenantId);

    const movementCount = await this.prisma.stockMovement.count({
      where: { productId: id },
    });

    const warehouseStockCount = await this.prisma.productWarehouse.count({
      where: { productId: id },
    });

    if (movementCount > 0 || warehouseStockCount > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: `Product deactivated because it is referenced by ${movementCount} movement record(s) and ${warehouseStockCount} warehouse stock record(s).`,
        deactivated: true,
      };
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }
}
