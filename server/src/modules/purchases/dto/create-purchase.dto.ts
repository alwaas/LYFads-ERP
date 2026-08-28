import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreatePurchaseDto {
  @IsDateString()
  purchaseDate: string;

  @IsString()
  vendorId: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsString()
  description: string;

  @IsDecimal()
  subtotal: string;

  @IsDecimal()
  tax: string;

  @IsDecimal()
  total: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
