import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDecimal,
} from 'class-validator';

import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDecimal()
  purchasePrice?: string;

  @IsOptional()
  @IsDecimal()
  sellingPrice?: string;

  @IsOptional()
  @IsDecimal()
  taxRate?: string;

  @IsOptional()
  @IsDecimal()
  reorderLevel?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsString()
  tenantId!: string;
}
