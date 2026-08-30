import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsDecimal()
  quantity: string;

  @IsDecimal()
  unitPrice: string;

  @IsOptional()
  @IsDecimal()
  taxRate?: string;

  @IsOptional()
  @IsDecimal()
  taxAmount?: string;

  @IsOptional()
  @IsDecimal()
  discount?: string;
}

export class CreateInvoiceDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  items: CreateInvoiceItemDto[];
}
