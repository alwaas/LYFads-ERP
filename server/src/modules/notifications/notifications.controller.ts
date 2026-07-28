import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('notifications')
@Roles(UserRole.SUPER_ADMIN)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
    }

    @Get()
findAll(
  @Query() pagination: PaginationDto,
  @Query() search: SearchDto,
) {
  return this.notificationsService.findAll(
    pagination,
    search,
  );
}

@Get('unread-count/:userId')
    unreadCount(@Param('userId') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }
}
