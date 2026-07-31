import { IsEnum, IsOptional, IsString } from 'class-validator';

import { WorkStatus } from '@prisma/client';

export class UpdateDailyWorkReportStatusDto {
  @IsEnum(WorkStatus)
  status: WorkStatus;

  @IsOptional()
  @IsString()
  managerRemarks?: string;
}
