import { IsDecimal, IsString } from 'class-validator';

export class AllocatePaymentDto {
  @IsString()
  paymentId: string;

  @IsDecimal()
  amount: string;
}
