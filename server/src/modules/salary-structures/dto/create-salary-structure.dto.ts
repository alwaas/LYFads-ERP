import { IsBoolean, IsDecimal, IsOptional, IsString } from 'class-validator';
import { IsDateString } from 'class-validator';

export class CreateSalaryStructureDto {
  @IsString()
  employeeId!: string;

  @IsDecimal()
  basicSalary!: string;

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

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

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
  @IsBoolean()
  isActive?: boolean;
}
