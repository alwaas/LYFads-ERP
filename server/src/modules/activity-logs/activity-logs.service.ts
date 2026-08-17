import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateActivityLogDto) {
    if (!dto.tenantId) {
      throw new Error('tenantId is required');
    }

    const activityData: Prisma.ActivityLogUncheckedCreateInput = {
      action: dto.action,
      module: dto.module,
      description: dto.description,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      userId: dto.userId,
      tenantId: dto.tenantId,
    };

    return this.prisma.activityLog.create({
      data: activityData,
    });
  }

  async findAll(pagination: PaginationDto, search: SearchDto) {
    const { skip, limit } = pagination;

    const where: Prisma.ActivityLogWhereInput = search.search
      ? {
          OR: [
            {
              action: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              module: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: search.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
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
      this.prisma.activityLog.count({
        where,
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

  async findOne(id: string) {
    const activityLog = await this.prisma.activityLog.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!activityLog) {
      throw new NotFoundException('Activity log not found.');
    }

    return activityLog;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.activityLog.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Activity log deleted successfully.',
    };
  }

  async getStatistics() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, totalUsers] = await this.prisma.$transaction([
      this.prisma.activityLog.count(),

      this.prisma.activityLog.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),

      this.prisma.user.count(),
    ]);

    return {
      totalLogs,
      todayLogs,
      totalUsers,
    };
  }

  async log(data: {
    action: string;
    module: string;
    description?: string;
    userId?: string;
    tenantId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    let finalTenantId: string;

    if (data.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: {
          id: data.userId,
        },
        select: {
          id: true,
          tenantId: true,
        },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      // If both userId and tenantId are provided, validate consistency
      if (data.tenantId && userExists.tenantId !== data.tenantId) {
        throw new ForbiddenException(
          'TenantId mismatch: user does not belong to the provided tenant',
        );
      }

      finalTenantId = userExists.tenantId;
    } else if (data.tenantId) {
      // Only tenantId provided - use it directly
      // Note: This should ideally be validated against authenticated user's tenant
      finalTenantId = data.tenantId;
    } else {
      throw new BadRequestException(
        'Either userId or tenantId must be provided',
      );
    }

    const activityData: Prisma.ActivityLogUncheckedCreateInput = {
      action: data.action,
      module: data.module,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      userId: data.userId,
      tenantId: finalTenantId,
    };

    return this.prisma.activityLog.create({
      data: activityData,
    });
  }
}
