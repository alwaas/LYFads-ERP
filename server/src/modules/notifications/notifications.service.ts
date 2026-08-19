import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateNotificationDto, userTenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this user');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        tenantId: userTenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'CREATE',
      module: 'NOTIFICATION',
      description: `Notification "${notification.title}" created.`,
      userId: notification.userId,
      tenantId: userTenantId,
    });

    return notification;
  }

  async findOne(id: string, userTenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId: userTenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  async update(id: string, dto: UpdateNotificationDto, userTenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId: userTenantId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.message !== undefined ? { message: dto.message } : {}),
        ...(dto.isRead !== undefined ? { isRead: dto.isRead } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'NOTIFICATION',
      description: `Notification updated.`,
      userId: updated.userId,
      tenantId: userTenantId,
    });

    return updated;
  }

  async remove(id: string, userTenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId: userTenantId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    await this.activityLogsService.log({
      action: 'DELETE',
      module: 'NOTIFICATION',
      description: `Notification deleted.`,
      userId: notification.userId,
      tenantId: userTenantId,
    });

    return {
      success: true,
      message: 'Notification deleted successfully.',
    };
  }

  async markAsRead(id: string, userTenantId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    const updated = await this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });

    await this.activityLogsService.log({
      action: 'UPDATE',
      module: 'NOTIFICATION',
      description: `Notification marked as read.`,
      userId: updated.userId,
      tenantId: userTenantId,
    });

    return updated;
  }

  async findAll(
    pagination: PaginationDto,
    search: SearchDto,
    userTenantId: string,
  ) {
    const { skip, limit } = pagination;

    const where: Prisma.NotificationWhereInput = {
      tenantId: userTenantId,
      ...(search.search
        ? {
            OR: [
              {
                title: {
                  contains: search.search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                message: {
                  contains: search.search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({
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

  async unreadCount(userId: string, userTenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this user');
    }

    const unread = await this.prisma.notification.count({
      where: {
        userId,
        tenantId: userTenantId,
        isRead: false,
      },
    });

    return {
      unread,
    };
  }
}
