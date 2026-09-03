import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateStockCountLineDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(0)
  countedQuantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStockCountDto {
  @IsString()
  warehouseId: string;

  @IsOptional()
  @IsDateString()
  countDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateStockCountLineDto)
  lines: CreateStockCountLineDto[];
}
