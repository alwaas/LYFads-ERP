import { IsOptional, IsString } from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
