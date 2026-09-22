import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveBalanceDto {
  @IsString()
  employeeId!: string;

  @IsEnum(LeaveType)
  leaveType!: LeaveType;

  @IsInt()
  year!: number;

  @IsOptional()
  @IsInt()
  allocated?: number;
}

export class UpdateLeaveBalanceDto {
  @IsOptional()
  @IsInt()
  allocated?: number;

  @IsOptional()
  @IsInt()
  used?: number;

  @IsOptional()
  @IsInt()
  remaining?: number;
}
