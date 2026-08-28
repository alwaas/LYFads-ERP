import { IsDateString, IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';

import { SalesOrderStatus } from '@prisma/client';

export class CreateSalesOrderDto {
  @IsString()
  orderNumber: string;

  @IsString()
  clientId: string;

  @IsDateString()
  orderDate: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;

  @IsDecimal()
  subtotal: string;

  @IsOptional()
  @IsDecimal()
  discount?: string;

  @IsOptional()
  @IsDecimal()
  tax?: string;

  @IsDecimal()
  total: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  tenantId!: string;
}
