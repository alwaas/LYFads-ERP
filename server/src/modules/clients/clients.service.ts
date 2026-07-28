import {
  ConflictException,
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

  async create(dto: CreateClientDto) {
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
        ...dto,
        email: dto.email.toLowerCase(),
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'CLIENT',
      description: `Client ${client.companyName} created successfully.`,
      userId: client.accountManagerId ?? undefined,
    });

    return client;
  }

  async findAll(pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
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

      this.prisma.client.count(),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async findOne(id: string) {
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

    return client;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
  ) {
    await this.findOne(id);

    const client = await this.prisma.client.update({
      where: {
        id,
      },
      data: {
        ...dto,
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
      description: `Client ${client.companyName} updated successfully.`,
      userId: client.accountManagerId ?? undefined,
    });

    return client;
  }

  async remove(id: string) {
    const client = await this.findOne(id);

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
    });

    return {
      success: true,
      message: 'Client deleted successfully.',
    };
  }
}
