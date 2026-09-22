import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SalesOrderItemInputDto {
  @IsString()
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
}

export class AddItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemInputDto)
  items!: SalesOrderItemInputDto[];
}
