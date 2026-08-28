import { IsDateString, IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';

import { SalesOrderStatus } from '@prisma/client';

export class UpdateSalesOrderDto {
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;

  @IsOptional()
  @IsDecimal()
  subtotal?: string;

  @IsOptional()
  @IsDecimal()
  discount?: string;

  @IsOptional()
  @IsDecimal()
  tax?: string;

  @IsOptional()
  @IsDecimal()
  total?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
