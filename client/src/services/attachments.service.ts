import api from "./api";

import type {
  Attachment,
  AttachmentResponse,
  AttachmentListResponse,
} from "../types/attachment";

export const uploadAttachment = async (
  file: File,
  options?: {
    projectId?: string;
    taskId?: string;
    milestoneId?: string;
    commentId?: string;
  },
): Promise<Attachment> => {
  const formData = new FormData();

  formData.append("file", file);

  if (options?.projectId) {
    formData.append("projectId", options.projectId);
  }

  if (options?.taskId) {
    formData.append("taskId", options.taskId);
  }

  if (options?.milestoneId) {
    formData.append("milestoneId", options.milestoneId);
  }

  if (options?.commentId) {
    formData.append("commentId", options.commentId);
  }

  const response = await api.post<{
    success: boolean;
    data: {
      success: boolean;
      data: Attachment;
    };
  }>("/uploads/single", formData);

  return response.data.data.data;
};

export const getAttachments = async (): Promise<Attachment[]> => {
  const response = await api.get<AttachmentListResponse>("/attachments");

  return response.data.data;
};

export const getAttachmentById = async (
  id: string,
): Promise<Attachment> => {
  const response = await api.get<AttachmentResponse>(
    `/attachments/${id}`,
  );

  return response.data.data;
};

export const updateAttachment = async (
  id: string,
  data: Record<string, unknown>,
) => {
  const response = await api.patch(`/attachments/${id}`, data);

  return response.data.data;
};

export const deleteAttachment = async (
  id: string,
): Promise<void> => {
  await api.delete(`/attachments/${id}`);
};