import { IsOptional, IsString } from 'class-validator';

export class VendorQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
