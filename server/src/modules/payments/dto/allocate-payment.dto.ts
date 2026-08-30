import { IsString, IsDecimal, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AllocatePaymentDto {
  @IsString()
  invoiceId: string;

  @IsDecimal()
  amount: string;
}

export class MultiAllocationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationItemDto)
  allocations: AllocationItemDto[];
}

export class AllocationItemDto {
  @IsString()
  invoiceId: string;

  @IsDecimal()
  amount: string;
}
