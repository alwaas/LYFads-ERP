import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { ActivityLogsService } from './activity-logs.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('activity-logs')
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.EMPLOYEE,
)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Post()
  create(@Body() dto: CreateActivityLogDto) {
    return this.activityLogsService.create(dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @Query() search: SearchDto) {
    return this.activityLogsService.findAll(pagination, search);
  }

  @Get('statistics')
  statistics() {
    return this.activityLogsService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityLogsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityLogsService.remove(id);
  }
}
