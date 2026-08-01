import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateKanbanDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsInt()
  order?: number;
}
