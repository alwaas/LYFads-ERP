import { IsOptional, IsString, IsEnum } from 'class-validator';

import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  checkIn?: string;

  @IsOptional()
  @IsString()
  checkOut?: string;
}
