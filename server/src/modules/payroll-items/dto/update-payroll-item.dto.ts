import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PayrollItemType } from '@prisma/client';
import { IsDecimal } from 'class-validator';

export class UpdatePayrollItemDto {
  @IsOptional()
  @IsEnum(PayrollItemType)
  type?: PayrollItemType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDecimal()
  amount?: string;

  @IsOptional()
  @IsInt()
  sequence?: number;
}
