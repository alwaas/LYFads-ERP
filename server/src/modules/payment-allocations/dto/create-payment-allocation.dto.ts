import { IsString, IsDecimal, IsOptional } from 'class-validator';

export class CreatePaymentAllocationDto {
  @IsString()
  paymentId: string;

  @IsString()
  invoiceId: string;

  @IsDecimal()
  amount: string;
}
