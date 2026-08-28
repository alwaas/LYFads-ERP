import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { InvoiceStatus, PaymentMethod, SalesOrderStatus } from '@prisma/client';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

export class DashboardQueryDto extends ReportQueryDto {}

export class SalesQueryDto extends ReportQueryDto {}

export class ReceivablesQueryDto extends ReportQueryDto {}

export class CustomerQueryDto extends ReportQueryDto {}

export class ExpenseQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  search?: string;
}

export class PurchaseQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  search?: string;
}

export class VendorQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ProfitabilityQueryDto extends ReportQueryDto {}

export class InventoryQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class SalesOrderQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;
}
