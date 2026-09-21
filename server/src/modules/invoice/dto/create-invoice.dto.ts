import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  salesOrderId?: string;

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

  @IsString()
  tenantId!: string;
}
