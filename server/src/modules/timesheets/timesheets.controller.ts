import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';

import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';

@Controller('timesheets')
@UseGuards(JwtAuthGuard)
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Post()
  create(@Body() dto: CreateTimesheetDto, @GetUser() user: AuthenticatedUser) {
    return this.timesheetsService.create(dto, user.tenantId, user.role);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SearchDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.findAll(pagination, search, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.timesheetsService.findOne(id, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTimesheetDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.update(id, dto, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.updateStatus(id, status, user.tenantId, user.userId);
  }

  @Post(':id/submit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  submit(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.timesheetsService.updateStatus(id, 'SUBMITTED', user.tenantId, user.userId);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  approve(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.timesheetsService.updateStatus(id, 'APPROVED', user.tenantId, user.userId);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  reject(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.updateStatus(id, 'REJECTED', user.tenantId, user.userId, rejectionReason);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.timesheetsService.remove(id, user.tenantId);
  }

  @Get('employee/:employeeId/summary')
  employeeSummary(
    @Param('employeeId') employeeId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.employeeSummary(employeeId, user.tenantId);
  }

  @Get('project/:projectId/summary')
  projectSummary(
    @Param('projectId') projectId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.projectSummary(projectId, user.tenantId);
  }
}
