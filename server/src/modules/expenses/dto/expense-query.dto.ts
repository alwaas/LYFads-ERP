import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class ExpenseQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  search?: string;
}
