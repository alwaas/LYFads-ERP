import api from "./api";

export type Comment = {
  id: string;
  message: string;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
};

export const getComments = async (page = 1, limit = 10) => {
  const response = await api.get("/comments", { params: { page, limit } });
  return response.data.data;
};

export const getComment = async (id: string) => {
  const response = await api.get(`/comments/${id}`);
  return response.data.data;
};

export const createComment = async (data: {
  message?: string;
  content?: string;
  userId?: string;
  projectId?: string;
  taskId?: string;
}) => {
  const response = await api.post("/comments", {
    message: data.message || data.content,
    userId: data.userId,
    projectId: data.projectId,
    taskId: data.taskId,
  });
  return response.data.data;
};

export const updateComment = async (
  id: string,
  data: { message?: string; content?: string }
) => {
  const response = await api.patch(`/comments/${id}`, {
    message: data.message || data.content,
  });
  return response.data.data;
};

export const deleteComment = async (id: string) => {
  const response = await api.delete(`/comments/${id}`);
  return response.data;
};

export const commentService = {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
};
