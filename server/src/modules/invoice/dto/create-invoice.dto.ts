import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsDecimal()
  subtotal: string;

  @IsOptional()
  @IsDecimal()
  tax?: string;

  @IsOptional()
  @IsDecimal()
  discount?: string;

  @IsDecimal()
  total: string;

  @IsOptional()
  @IsDecimal()
  paidAmount?: string;

  @IsDecimal()
  balanceAmount: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
