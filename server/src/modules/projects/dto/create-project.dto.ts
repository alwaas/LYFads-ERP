import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { ProjectPriority, ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  projectCode!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProjectStatus)
  status!: ProjectStatus;

  @IsEnum(ProjectPriority)
  priority!: ProjectPriority;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsString()
  clientId!: string;

  @IsOptional()
  @IsString()
  managerId?: string;
}
