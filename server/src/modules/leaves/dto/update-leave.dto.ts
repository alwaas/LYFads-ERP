import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";

export enum LeaveType {
  CASUAL = "CASUAL",
  SICK = "SICK",
  EARNED = "EARNED",
  UNPAID = "UNPAID",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
}

export class UpdateLeaveDto {
  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
