import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInvoiceFromSalesOrderDto {
  @IsDateString()
  issueDate?: string;

  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
