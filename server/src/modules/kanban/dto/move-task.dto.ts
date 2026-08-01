import { IsEnum, IsInt } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsInt()
  order: number;
}
