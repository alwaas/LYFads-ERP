import { IsOptional, IsString } from 'class-validator';

export class CreateActivityLogDto {
  @IsString()
  action: string;

  @IsString()
  module: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}