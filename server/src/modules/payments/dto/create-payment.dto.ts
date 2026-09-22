import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
  Length,
} from 'class-validator';

import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  purchaseInvoiceId?: string;

  @IsOptional()
  @IsString()
  expenseId?: string;

  @IsOptional()
  @IsString()
  payrollId?: string;

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

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
