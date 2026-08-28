import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
