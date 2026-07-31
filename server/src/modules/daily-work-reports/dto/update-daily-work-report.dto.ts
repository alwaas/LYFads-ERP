import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { WorkStatus } from '@prisma/client';

export class UpdateDailyWorkReportDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
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
  @IsDecimal()
  hoursWorked?: string;

  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @IsOptional()
  @IsString()
  managerRemarks?: string;
}
