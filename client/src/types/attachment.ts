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
}

export interface AttachmentResponse {
  success: boolean;
  data: Attachment;
}

export interface AttachmentListResponse {
  success: boolean;
  data: Attachment[];
}