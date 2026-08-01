import { IsDecimal, IsString } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  invoiceId: string;

  @IsString()
  description: string;

  @IsDecimal()
  quantity: string;

  @IsDecimal()
  unitPrice: string;

  @IsDecimal()
  amount: string;
}
