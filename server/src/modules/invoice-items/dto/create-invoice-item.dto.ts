import { IsDecimal, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  invoiceId: string;

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

  @IsDecimal()
  lineTotal: string;
}
