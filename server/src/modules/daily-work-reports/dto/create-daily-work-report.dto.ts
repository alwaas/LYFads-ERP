import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { WorkStatus } from '@prisma/client';

export class CreateDailyWorkReportDto {
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
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

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  hoursWorked: number;

  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;

  @IsOptional()
  @IsString()
  managerRemarks?: string;
}
