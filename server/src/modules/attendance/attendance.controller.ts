import {
  Body,
  Controller,
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

import { AttendanceService } from './attendance.service';
import { AttendanceHistoryDto } from './dto/attendance-history.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Post('check-in')
  checkIn(
    @Body() dto: CreateAttendanceDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.checkIn(dto, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Patch('check-out/:employeeId')
  checkOut(
    @Param('employeeId') employeeId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.checkOut(employeeId, user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get('today')
  todayAttendance(@GetUser() user: AuthenticatedUser) {
    return this.attendanceService.todayAttendance(user.tenantId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get('history')
  attendanceHistory(
    @Query() query: AttendanceHistoryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.attendanceHistory(query, user.tenantId);
  }
}
