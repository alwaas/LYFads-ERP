import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateActivityLogDto) {
    return this.prisma.activityLog.create({
      data: {
        action: dto.action,
        module: dto.module,
        description: dto.description,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        userId: dto.userId,
      },
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
    ipAddress?: string;
    userAgent?: string;
  }) {
    const activityData: Prisma.ActivityLogCreateInput = {
      action: data.action,
      module: data.module,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };

    if (data.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: {
          id: data.userId,
        },
        select: {
          id: true,
        },
      });

      if (userExists) {
        activityData.user = {
          connect: {
            id: data.userId,
          },
        };
      }
    }

    return this.prisma.activityLog.create({
      data: activityData,
    });
  }
}
