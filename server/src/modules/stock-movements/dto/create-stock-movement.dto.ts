import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsIn,
} from 'class-validator';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
  TRANSFER = 'TRANSFER',
}

export class CreateStockMovementDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  sourceWarehouseId?: string;

  @IsOptional()
  @IsString()
  destinationWarehouseId?: string;

  @IsEnum(MovementType)
  type: MovementType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
