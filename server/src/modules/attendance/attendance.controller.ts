import {
  Body,
  Controller,
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

import { AttendanceService } from './attendance.service';
import { AttendanceHistoryDto } from './dto/attendance-history.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Post('check-in/self')
  checkInSelf(@GetUser() user: AuthenticatedUser) {
    return this.attendanceService.checkInSelf(user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
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
  @Patch('check-out/self')
  checkOutSelf(@GetUser() user: AuthenticatedUser) {
    return this.attendanceService.checkOutSelf(user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
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
  @Get('my-status')
  getMyStatus(@GetUser() user: AuthenticatedUser) {
    return this.attendanceService.getMyStatus(user);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @Get('today')
  todayAttendance(@GetUser() user: AuthenticatedUser) {
    return this.attendanceService.todayAttendance(user.tenantId, user);
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
    return this.attendanceService.attendanceHistory(query, user.tenantId, user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.attendanceService.findOne(id, user.tenantId);
  }
}
