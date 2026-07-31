export interface Attachment {
  id: string;

  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;

  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  commentId?: string;

  uploadedBy: string;

  createdAt: string;
}

export interface UploadAttachmentDto {
  file: File;

  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  commentId?: string;
}

export interface AttachmentResponse {
  success: boolean;
  data: Attachment;
}

export interface AttachmentListResponse {
  success: boolean;
  data: Attachment[];
}