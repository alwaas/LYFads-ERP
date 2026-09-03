import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateSalesOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsDecimal()
  quantity: string;

  @IsDecimal()
  unitPrice: string;

  @IsOptional()
  @IsDecimal()
  discount?: string;

  @IsOptional()
  @IsDecimal()
  tax?: string;

  @IsOptional()
  @IsDecimal()
  lineTotal?: string;

  @IsOptional()
  sequence?: number;
}

export class CreateSalesOrderDto {
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsDateString()
  orderDate: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items!: CreateSalesOrderItemDto[];

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
}
