import {
  IsDateString,
  IsDecimal,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTimesheetDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsDateString()
  workDate: Date;

  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsDecimal()
  hours: string;

  @IsOptional()
  @IsString()
  description?: string;
}