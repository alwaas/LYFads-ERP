import { IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
