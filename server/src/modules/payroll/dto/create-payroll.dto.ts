import {
  IsInt,
  IsOptional,
  IsString,
  IsDecimal,
  IsEnum,
} from 'class-validator';

import { PayrollStatus } from '@prisma/client';

export class CreatePayrollDto {
  @IsString()
  employeeId: string;

  @IsInt()
  month: number;

  @IsInt()
  year: number;

  @IsDecimal()
  basicSalary: string;

  @IsOptional()
  @IsDecimal()
  totalHours?: string;

  @IsOptional()
  @IsDecimal()
  overtimeHours?: string;

  @IsOptional()
  @IsDecimal()
  overtimeAmount?: string;

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
  grossSalary?: string;

  @IsOptional()
  @IsDecimal()
  pf?: string;

  @IsOptional()
  @IsDecimal()
  esi?: string;

  @IsOptional()
  @IsDecimal()
  tds?: string;

  @IsOptional()
  @IsDecimal()
  deductions?: string;

  @IsOptional()
  @IsDecimal()
  totalDeduction?: string;

  @IsDecimal()
  netSalary: string;

  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @IsOptional()
  @IsString()
  payslipNo?: string;
}