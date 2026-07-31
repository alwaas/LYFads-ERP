import { IsOptional, IsString } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  fileName: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  fileSize: number;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsString()
  commentId?: string;

  @IsString()
  uploadedBy: string;
}
