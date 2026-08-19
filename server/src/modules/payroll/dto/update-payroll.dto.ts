import { IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePayrollDto } from './create-payroll.dto';

export class UpdatePayrollDto extends PartialType(CreatePayrollDto) {
  @IsOptional()
  @IsString()
  generatedAt?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;
}
