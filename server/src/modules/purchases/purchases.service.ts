import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseQueryDto } from './dto/purchase-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto, userTenantId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: dto.vendorId,
        tenantId: userTenantId,
      },
    });

    if (!vendor) {
      throw new ForbiddenException(
        'Vendor does not belong to the current tenant or is invalid.',
      );
    }

    if (!vendor.isActive) {
      throw new ForbiddenException(
        'Cannot create a purchase with an inactive vendor.',
      );
    }

    const purchase = await this.prisma.purchase.create({
      data: {
        purchaseDate: new Date(dto.purchaseDate),
        vendorId: dto.vendorId,
        referenceNo: dto.referenceNo,
        description: dto.description,
        subtotal: new Prisma.Decimal(dto.subtotal),
        tax: new Prisma.Decimal(dto.tax),
        total: new Prisma.Decimal(dto.total),
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        tenantId: userTenantId,
      },
      include: {
        vendorInfo: true,
      },
    });

    return {
      ...purchase,
      vendor: purchase.vendorInfo,
    };
  }

  async findAll(query: PurchaseQueryDto, userTenantId: string) {
    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
      if (query.dateTo) dateFilter.lte = new Date(`${query.dateTo}T23:59:59`);
      where.purchaseDate = dateFilter;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.method) {
      where.paymentMethod = query.method;
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { referenceNo: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        {
          vendorInfo: {
            name: { contains: query.search, mode: Prisma.QueryMode.insensitive },
          },
        },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        orderBy: {
          purchaseDate: 'desc',
        },
        include: {
          vendorInfo: true,
        },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      total,
      data: data.map((purchase) => ({
        ...purchase,
        vendor: purchase.vendorInfo,
      })),
    };
  }

  async findOne(id: string, userTenantId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        vendorInfo: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this purchase');
    }

    if (purchase.vendorInfo && purchase.vendorInfo.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this purchase vendor');
    }

    return {
      ...purchase,
      vendor: purchase.vendorInfo,
    };
  }

  async update(id: string, dto: UpdatePurchaseDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    const updateData: Record<string, unknown> = {
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      referenceNo: dto.referenceNo,
      description: dto.description,
      subtotal: dto.subtotal ? new Prisma.Decimal(dto.subtotal) : undefined,
      tax: dto.tax ? new Prisma.Decimal(dto.tax) : undefined,
      total: dto.total ? new Prisma.Decimal(dto.total) : undefined,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
    };

    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({
        where: {
          id: dto.vendorId,
          tenantId: userTenantId,
        },
      });

      if (!vendor) {
        throw new ForbiddenException(
          'Vendor does not belong to the current tenant or is invalid.',
        );
      }

      if (!vendor.isActive) {
        throw new ForbiddenException(
          'Cannot assign an inactive vendor to a purchase.',
        );
      }

      updateData.vendorId = dto.vendorId;
    }

    const purchase = await this.prisma.purchase.update({
      where: { id },
      data: updateData,
      include: {
        vendorInfo: true,
      },
    });

    return {
      ...purchase,
      vendor: purchase.vendorInfo,
    };
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    await this.prisma.purchase.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Purchase deleted successfully',
    };
  }
}
