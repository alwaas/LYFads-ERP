import {
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class ReceiveItemDto {
  @IsString()
  itemId!: string;

  @IsNumber()
  @Min(0)
  receivedQuantity!: number;
}
