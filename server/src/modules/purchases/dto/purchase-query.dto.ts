import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PurchaseQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  search?: string;
}
