import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseQueryDto } from './dto/warehouse-query.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { EntitlementService } from '../subscriptions/entitlement.service';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementService: EntitlementService,
  ) {}

  async create(dto: CreateWarehouseDto, userTenantId: string) {
    await this.entitlementService.enforceLimit(userTenantId, 'MAX_WAREHOUSES');

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { tenantId: userTenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: dto.name,
        location: dto.location,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
        tenantId: userTenantId,
      },
    });

    return warehouse;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    query: WarehouseQueryDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    if (search.search) {
      where.OR = [
        { name: { contains: search.search, mode: 'insensitive' } },
        { location: { contains: search.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.warehouse.count({ where }),
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
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stockMovements: true,
            warehouseStocks: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    if (warehouse.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this warehouse');
    }

    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto, userTenantId: string) {
    const warehouse = await this.findOne(id, userTenantId);

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { tenantId: userTenantId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: {
        name: dto.name,
        location: dto.location,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
      },
      include: {
        _count: {
          select: {
            stockMovements: true,
            warehouseStocks: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string, userTenantId: string) {
    const warehouse = await this.findOne(id, userTenantId);

    const movementCount = await this.prisma.stockMovement.count({
      where: {
        OR: [
          { warehouseId: id },
          { sourceWarehouseId: id },
          { destinationWarehouseId: id },
        ],
      },
    });

    const warehouseStockCount = await this.prisma.productWarehouse.count({
      where: { warehouseId: id },
    });

    if (movementCount > 0 || warehouseStockCount > 0) {
      await this.prisma.warehouse.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: `Warehouse deactivated because it is referenced by ${movementCount} movement record(s) and ${warehouseStockCount} stock record(s).`,
        deactivated: true,
      };
    }

    await this.prisma.warehouse.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Warehouse deleted successfully',
    };
  }
}
