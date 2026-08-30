import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma, ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateProductDto, userTenantId: string, userId?: string) {
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create product for a different tenant',
      );
    }

    const existing = await this.prisma.product.findFirst({
      where: {
        sku: dto.sku,
        tenantId: userTenantId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Product SKU already exists in this tenant.',
      );
    }

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unit: dto.unit,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        taxRate: dto.taxRate,
        reorderLevel: dto.reorderLevel,
        status: dto.status,
        tenantId: userTenantId,
      },
    });

    await this.activityLogs.create({
      action: 'CREATE',
      module: 'PRODUCTS',
      description: `Product "${product.name}" created`,
      userId,
      tenantId: userTenantId,
    });

    return product;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Prisma.ProductWhereInput = {
      tenantId: userTenantId,
      ...(search.search && {
        OR: [
          { name: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          { sku: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
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
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId: userTenantId },
    });

    if (!product) {
      const exists = await this.prisma.product.findUnique({
        where: { id },
        select: { id: true },
      });

      if (exists) {
        throw new ForbiddenException('Access denied to this product.');
      }

      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, userTenantId: string, userId?: string) {
    const product = await this.findOne(id, userTenantId);

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.prisma.product.findFirst({
        where: {
          sku: dto.sku,
          tenantId: userTenantId,
          id: { not: id },
        },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(
          'Product SKU already exists in this tenant.',
        );
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unit: dto.unit,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        taxRate: dto.taxRate,
        reorderLevel: dto.reorderLevel,
        status: dto.status,
      },
    });

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'PRODUCTS',
      description: `Product "${updatedProduct.name}" updated`,
      userId,
      tenantId: userTenantId,
    });

    return updatedProduct;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId: userTenantId },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.INACTIVE },
    });

    await this.activityLogs.create({
      action: 'DELETE',
      module: 'PRODUCTS',
      description: `Product "${product.name}" deactivated`,
      userId,
      tenantId: userTenantId,
    });

    return { message: 'Product deactivated successfully.', id: product.id };
  }
}
