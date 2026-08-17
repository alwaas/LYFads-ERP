import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';

import { PrismaService } from '../../database';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateClientDto, userTenantId: string) {
    // Validate that dto.tenantId (if provided) matches authenticated user's tenant
    if (dto.tenantId && dto.tenantId !== userTenantId) {
      throw new ForbiddenException(
        'Cannot create client for a different tenant',
      );
    }

    const existing = await this.prisma.client.findUnique({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (existing) {
      throw new ConflictException('Client email already exists.');
    }

    const client = await this.prisma.client.create({
      data: {
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        gstNumber: dto.gstNumber,
        website: dto.website,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pincode: dto.pincode,
        accountManagerId: dto.accountManagerId,
        tenantId: userTenantId,
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'CLIENT',
      description: `Client ${client.companyName} created successfully.`,
      userId: client.accountManagerId ?? undefined,
      tenantId: userTenantId,
    });

    return client;
  }

  async findAll(pagination: PaginationDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where: {
          tenantId: userTenantId,
        },
        skip,
        take: limit,
        include: {
          accountManager: {
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

      this.prisma.client.count({
        where: {
          tenantId: userTenantId,
        },
      }),
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
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found.');
    }

    // Verify tenant ownership
    if (client.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this client');
    }

    return client;
  }

  async update(id: string, dto: UpdateClientDto, userTenantId: string) {
    await this.findOne(id, userTenantId);

    // Prevent tenantId change by removing it from the update data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenantId: _tenantId, ...updateData } = dto;

    const updatedClient = await this.prisma.client.update({
      where: {
        id,
      },
      data: {
        ...updateData,
        email: dto.email?.toLowerCase(),
      },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'CLIENT',
      description: `Client ${updatedClient.companyName} updated successfully.`,
      userId: updatedClient.accountManagerId ?? undefined,
      tenantId: userTenantId,
    });

    return updatedClient;
  }

  async remove(id: string, userTenantId: string) {
    const client = await this.findOne(id, userTenantId);

    await this.prisma.client.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'CLIENT',
      description: `Client ${client.companyName} deleted successfully.`,
      userId: client.accountManager?.id ?? undefined,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Client deleted successfully.',
    };
  }
}
