import { Type } from 'class-transformer';

import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { WorkStatus } from '@prisma/client';

export class UpdateDailyWorkReportDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @IsOptional()
  @IsString()
  yesterdayWork?: string;

  @IsOptional()
  @IsString()
  todayWork?: string;

  @IsOptional()
  @IsString()
  tomorrowPlan?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    {
      message: 'hoursWorked must be a valid number.',
    },
  )
  hoursWorked?: number;

  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @IsOptional()
  @IsString()
  managerRemarks?: string;
}