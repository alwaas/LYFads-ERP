import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReceiveItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsDecimal()
  quantity: string;
}

export class ReceivePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required to receive' })
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
