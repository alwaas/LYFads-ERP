import { Type } from 'class-transformer';

import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { WorkStatus } from '@prisma/client';

export class CreateDailyWorkReportDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  taskId?: string;

  @IsDateString()
  reportDate: string;

  @IsOptional()
  @IsString()
  yesterdayWork?: string;

  @IsString()
  @IsNotEmpty()
  todayWork: string;

  @IsOptional()
  @IsString()
  tomorrowPlan?: string;

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
  hoursWorked: number;

  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @IsOptional()
  @IsString()
  managerRemarks?: string;
}