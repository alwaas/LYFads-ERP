import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
  IsUUID,
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

  @IsOptional()
  @IsDecimal()
  taxAmount?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string | null;

  @IsOptional()
  @IsUUID()
  employeeId?: string | null;

  @IsOptional()
  @IsUUID()
  glAccountId?: string | null;
}
