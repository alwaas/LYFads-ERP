import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorQueryDto } from './dto/vendor-query.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVendorDto, userTenantId: string) {
    if (dto.email) {
      const existing = await this.prisma.vendor.findFirst({
        where: {
          email: dto.email,
          tenantId: userTenantId,
        },
      });

      if (existing) {
        throw new ConflictException(
          'A vendor with this email already exists in your organization.',
        );
      }
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pincode: dto.pincode,
        gstNumber: dto.gstNumber,
        notes: dto.notes,
        tenantId: userTenantId,
      },
    });

    return vendor;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    query: VendorQueryDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = {
      tenantId: userTenantId,
    };

    if (query.isActive !== undefined) {
      const isActive = query.isActive === 'true';
      where.isActive = isActive;
    }

    if (search.search) {
      where.OR = [
        { name: { contains: search.search, mode: 'insensitive' } },
        { contactPerson: { contains: search.search, mode: 'insensitive' } },
        { email: { contains: search.search, mode: 'insensitive' } },
        { phone: { contains: search.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.vendor.count({ where }),
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
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this vendor');
    }

    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    if (dto.email) {
      const existing = await this.prisma.vendor.findFirst({
        where: {
          email: dto.email,
          tenantId: userTenantId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'A vendor with this email already exists in your organization.',
        );
      }
    }

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pincode: dto.pincode,
        gstNumber: dto.gstNumber,
        notes: dto.notes,
        isActive: dto.isActive,
      },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    return vendor;
  }

  async remove(id: string, userTenantId: string) {
    const vendor = await this.findOne(id, userTenantId);

    const purchaseCount = await this.prisma.purchase.count({
      where: { vendorId: id },
    });

    if (purchaseCount > 0) {
      await this.prisma.vendor.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: `Vendor deactivated because it is referenced by ${purchaseCount} purchase record(s).`,
        deactivated: true,
      };
    }

    await this.prisma.vendor.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Vendor deleted successfully',
    };
  }
}
