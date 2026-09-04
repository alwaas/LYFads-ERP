import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PurchaseInvoiceStatus } from '@prisma/client';

export class PurchaseInvoiceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PurchaseInvoiceStatus)
  status?: PurchaseInvoiceStatus;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  purchaseOrderId?: string;
}
