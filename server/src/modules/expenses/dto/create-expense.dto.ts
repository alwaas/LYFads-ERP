import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
} from 'class-validator';

import { ExpenseCategory, ExpenseStatus, PaymentMethod } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsDecimal()
  amount: string;

  @IsDateString()
  expenseDate: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  vendor: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;
}
