import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateLeaveBalanceDto {
  @IsOptional()
  @IsInt()
  allocated?: number;

  @IsOptional()
  @IsInt()
  used?: number;

  @IsOptional()
  @IsInt()
  remaining?: number;
}
