import { IsString, IsDecimal, IsOptional } from 'class-validator';

export class CreatePaymentAllocationDto {
  @IsString()
  paymentId: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  purchaseInvoiceId?: string;

  @IsDecimal()
  amount: string;
}
