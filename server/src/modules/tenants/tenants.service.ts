import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateTenantDto, userId: string) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        maxUsers: dto.maxUsers ?? 10,
        maxStorage: dto.maxStorage ?? 1024,
      },
    });

    await this.activityLogs.create({
      action: 'CREATE',
      module: 'TENANTS',
      description: `Tenant "${tenant.name}" created`,
      userId,
      tenantId: tenant.id,
    });

    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, userId: string) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.tenant.findFirst({
        where: {
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'TENANTS',
      description: `Tenant "${tenant.name}" updated`,
      userId,
      tenantId: tenant.id,
    });

    return tenant;
  }

  async suspend(id: string, userId: string) {
    const tenant = await this.findOne(id);

    if (tenant.status === 'SUSPENDED') {
      return tenant;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'TENANTS',
      description: `Tenant "${tenant.name}" suspended`,
      userId,
      tenantId: tenant.id,
    });

    return updated;
  }

  async activate(id: string, userId: string) {
    const tenant = await this.findOne(id);

    if (tenant.status === 'ACTIVE') {
      return tenant;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.activityLogs.create({
      action: 'UPDATE',
      module: 'TENANTS',
      description: `Tenant "${tenant.name}" activated`,
      userId,
      tenantId: tenant.id,
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const tenant = await this.findOne(id);

    await this.activityLogs.create({
      action: 'DELETE',
      module: 'TENANTS',
      description: `Tenant "${tenant.name}" deleted`,
      userId,
      tenantId: tenant.id,
    });

    await this.prisma.tenant.delete({
      where: { id },
    });

    return {
      message: 'Tenant deleted successfully',
      id,
    };
  }
}