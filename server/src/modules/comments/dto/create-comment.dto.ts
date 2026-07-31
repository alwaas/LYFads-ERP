import { IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsString()
  userId: string;
}
