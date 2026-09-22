import { IsOptional, IsString } from 'class-validator';

export class WarehouseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
