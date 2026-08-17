import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth-user.type';

import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';

@Controller('timesheets')
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
    return this.timesheetsService.create(dto, user.tenantId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.timesheetsService.findAll(user.tenantId);
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
