import { IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';
import { EmploymentStatus } from '@prisma/client';
import { IsDateString } from 'class-validator';

export class UpdateSalaryStructureDto {
  @IsOptional()
  @IsDecimal()
  basicSalary?: string;

  @IsOptional()
  @IsDecimal()
  hra?: string;

  @IsOptional()
  @IsDecimal()
  allowances?: string;

  @IsOptional()
  @IsDecimal()
  bonus?: string;

  @IsOptional()
  @IsDecimal()
  incentives?: string;

  @IsOptional()
  @IsDecimal()
  deductions?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  isActive?: EmploymentStatus;
}
