import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { LeaveType } from "@prisma/client";

export class CreateLeaveDto {
  @IsString()
  employeeId: string;

  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}