import api from "./api";

import type {
  Attachment,
  AttachmentListResponse,
  AttachmentResponse,
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

  const response = await api.post<AttachmentResponse>(
    "/uploads/single",
    formData,
  );

  return response.data.data;
};

export const getAttachments = async (page = 1, limit = 10, filters?: {
  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  commentId?: string;
  mimeType?: string;
  search?: string;
}): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  if (filters?.projectId) params.projectId = filters.projectId;
  if (filters?.taskId) params.taskId = filters.taskId;
  if (filters?.milestoneId) params.milestoneId = filters.milestoneId;
  if (filters?.commentId) params.commentId = filters.commentId;
  if (filters?.mimeType && filters.mimeType !== 'all') params.mimeType = filters.mimeType;
  if (filters?.search) params.search = filters.search;

  const response = await api.get<AttachmentListResponse>("/attachments", { params });
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
) => {
  const response = await api.delete(
    `/attachments/${id}`,
  );
  return response.data;
};
