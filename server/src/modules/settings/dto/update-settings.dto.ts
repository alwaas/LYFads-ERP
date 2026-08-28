import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  timezone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
