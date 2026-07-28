import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { AttendanceHistoryDto } from "./dto/attendance-history.dto";
import { CreateAttendanceDto } from './dto/create-attendance.dto';
// import { PaginationDto } from '../../common/dto/pagination.dto';
// import { SearchDto } from '../../common/dto/search.dto';

@Controller('attendance')
@Roles(UserRole.SUPER_ADMIN)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.checkIn(dto);
  }

  @Patch('check-out/:employeeId')
    checkOut(@Param('employeeId') employeeId: string) {
    return this.attendanceService.checkOut(employeeId);
    }

  @Get('today')
    todayAttendance() {
    return this.attendanceService.todayAttendance();
    }


  @Get("history")
  attendanceHistory(
    @Query() query: AttendanceHistoryDto,
  ) {
    return this.attendanceService.attendanceHistory(query);
  }

}
