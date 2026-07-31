import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
      },
    });
  }

  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, search: SearchDto) {
    const { skip, limit } = pagination;

    const where: Prisma.NotificationWhereInput = search.search
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
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
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

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      unread: count,
    };
  }
}
