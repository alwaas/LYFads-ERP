import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { PrismaService } from '../../database/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateVendorDto, userTenantId: string, userId?: string) {
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create vendor for a different tenant',
      );
    }

    const existing = await this.prisma.vendor.findFirst({
      where: {
        vendorCode: dto.vendorCode,
        tenantId: userTenantId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Vendor code already exists in this tenant.',
      );
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        name: dto.name,
        vendorCode: dto.vendorCode,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        taxNumber: dto.taxNumber,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
        status: dto.status,
        tenantId: userTenantId,
        createdById: userId,
      },
    });

    await this.activityLogs.create({
      action: 'CREATE',
      module: 'VENDORS',
      description: `Vendor "${vendor.name}" created`,
      userId,
      tenantId: userTenantId,
    });

    return vendor;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Prisma.VendorWhereInput = {
      tenantId: userTenantId,
    };

    if (search.search) {
      where.OR = [
        { name: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { vendorCode: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { contactPerson: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search.search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.vendor.count({ where }),
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
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found.');
    }

    if (vendor.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this vendor');
    }

    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto, userTenantId: string, userId?: string) {
    const vendor = await this.findOne(id, userTenantId);

    if (dto.vendorCode && dto.vendorCode !== vendor.vendorCode) {
      const existing = await this.prisma.vendor.findFirst({
        where: {
          vendorCode: dto.vendorCode,
          tenantId: userTenantId,
          id: { not: id },
        },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(
          'Vendor code already exists in this tenant.',
        );
      }
    }

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        name: dto.name,
        vendorCode: dto.vendorCode,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        taxNumber: dto.taxNumber,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
        status: dto.status,
      },
    });

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'VENDORS',
      description: `Vendor "${updatedVendor.name}" updated`,
      userId,
      tenantId: userTenantId,
    });

    return updatedVendor;
  }

  async remove(id: string, userTenantId: string, userId?: string) {
    const vendor = await this.findOne(id, userTenantId);

    await this.prisma.vendor.delete({
      where: { id },
    });

    await this.activityLogs.create({
      action: 'DELETE',
      module: 'VENDORS',
      description: `Vendor "${vendor.name}" deleted`,
      userId,
      tenantId: userTenantId,
    });

    return {
      message: 'Vendor deleted successfully',
      id,
    };
  }
}
