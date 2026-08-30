import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
} from 'class-validator';

import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsDecimal()
  amount: string;

  @IsDateString()
  paymentDate: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
