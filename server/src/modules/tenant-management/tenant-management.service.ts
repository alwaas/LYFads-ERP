import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';

const TENANT_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
  maxUsers: true,
  maxStorage: true,
  email: true,
  phone: true,
  address: true,
  logo: true,
  timezone: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class TenantManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAll(pagination: PaginationDto, search?: string) {
    const { skip, limit } = pagination;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        select: {
          ...TENANT_SELECT,
          _count: {
            select: {
              users: true,
              employees: true,
              clients: true,
              projects: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant slug already exists.');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        status: (dto.status as any) ?? 'ACTIVE',
        maxUsers: dto.maxUsers ?? 10,
        maxStorage: dto.maxStorage ?? 1024,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        timezone: dto.timezone ?? 'UTC',
        currency: dto.currency ?? 'USD',
      },
      select: TENANT_SELECT,
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'TENANT',
      description: `Tenant ${tenant.name} created.`,
      tenantId: tenant.id,
    });

    return tenant;
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        ...TENANT_SELECT,
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
                billingInterval: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            employees: true,
            clients: true,
            projects: true,
            products: true,
            invoices: true,
            salesOrders: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.slug && dto.slug !== tenant.slug) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Tenant slug already exists.');
      }
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
        ...(dto.maxStorage !== undefined && { maxStorage: dto.maxStorage }),
      },
      select: TENANT_SELECT,
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'TENANT',
      description: `Tenant ${updated.name} updated.`,
      tenantId: updated.id,
    });

    return updated;
  }

  async activate(id: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === 'ACTIVE') {
      return tenant;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: TENANT_SELECT,
    });

    await this.activityLogsService.log({
      action: 'ACTIVATE',
      module: 'TENANT',
      description: `Tenant ${updated.name} activated.`,
      userId,
      tenantId: updated.id,
    });

    return updated;
  }

  async suspend(id: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === 'SUSPENDED') {
      return tenant;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      select: TENANT_SELECT,
    });

    await this.activityLogsService.log({
      action: 'SUSPEND',
      module: 'TENANT',
      description: `Tenant ${updated.name} suspended.`,
      userId,
      tenantId: updated.id,
    });

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === 'INACTIVE') {
      return tenant;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: TENANT_SELECT,
    });

    await this.activityLogsService.log({
      action: 'DEACTIVATE',
      module: 'TENANT',
      description: `Tenant ${updated.name} deactivated.`,
      userId,
      tenantId: updated.id,
    });

    return updated;
  }

  async getCurrentTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        ...TENANT_SELECT,
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                price: true,
                billingInterval: true,
                features: true,
                limits: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateCurrentTenant(
    tenantId: string,
    dto: UpdateTenantProfileDto,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
      },
      select: TENANT_SELECT,
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'TENANT',
      description: `Tenant profile updated.`,
      tenantId: updated.id,
    });

    return updated;
  }
}
