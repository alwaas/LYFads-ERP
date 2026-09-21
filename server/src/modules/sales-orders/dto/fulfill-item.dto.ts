import {
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class FulfillItemDto {
  @IsString()
  itemId!: string;

  @IsNumber()
  @Min(0)
  fulfillQuantity!: number;
}
