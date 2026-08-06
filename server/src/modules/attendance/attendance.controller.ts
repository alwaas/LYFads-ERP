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
  checkIn(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.checkIn(dto);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Patch('check-out/:employeeId')
  checkOut(@Param('employeeId') employeeId: string) {
    return this.attendanceService.checkOut(employeeId);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
  )
  @Get('today')
  todayAttendance() {
    return this.attendanceService.todayAttendance();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get('history')
  attendanceHistory(@Query() query: AttendanceHistoryDto) {
    return this.attendanceService.attendanceHistory(query);
  }
}
