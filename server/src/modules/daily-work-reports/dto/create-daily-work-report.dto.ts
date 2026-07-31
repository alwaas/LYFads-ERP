import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { WorkStatus } from '@prisma/client';

export class CreateDailyWorkReportDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsDateString()
  reportDate: string;

  @IsOptional()
  @IsString()
  yesterdayWork?: string;

  @IsString()
  todayWork: string;

  @IsOptional()
  @IsString()
  tomorrowPlan?: string;

  @IsDecimal()
  hoursWorked: string;

  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @IsOptional()
  @IsString()
  managerRemarks?: string;
}
