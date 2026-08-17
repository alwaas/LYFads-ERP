import { Type } from 'class-transformer';

import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

import { WorkStatus } from '@prisma/client';

export class UpdateDailyWorkReportDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  employeeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
