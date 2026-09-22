import { IsDecimal, IsOptional, IsString } from 'class-validator';

export class RecordExpensePaymentDto {
  @IsDecimal()
  amount: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
