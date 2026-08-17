import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

import { DailyWorkReportsService } from './daily-work-reports.service';

import { CreateDailyWorkReportDto } from './dto/create-daily-work-report.dto';
import { UpdateDailyWorkReportDto } from './dto/update-daily-work-report.dto';
import { UpdateDailyWorkReportStatusDto } from './dto/update-daily-work-report-status.dto';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

@Controller('daily-work-reports')
export class DailyWorkReportsController {
  constructor(
    private readonly dailyWorkReportsService: DailyWorkReportsService,
  ) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Post()
  create(
    @Body() dto: CreateDailyWorkReportDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.dailyWorkReportsService.create(dto, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.dailyWorkReportsService.findAll(
      pagination,
      search,
      user.tenantId,
    );
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.dailyWorkReportsService.findOne(id, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDailyWorkReportDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.dailyWorkReportsService.update(id, dto, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDailyWorkReportStatusDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.dailyWorkReportsService.updateStatus(id, dto, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.dailyWorkReportsService.remove(id, user.tenantId);
  }
}
