import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreateExpenseDto {
  @IsDateString()
  expenseDate: string;

  @IsString()
  category: string;

  @IsString()
  description: string;

  @IsDecimal()
  amount: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
