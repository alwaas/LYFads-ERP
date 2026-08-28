import api from "./api";
import type { Milestone } from "../types/milestone";

export type CreateMilestoneData = {
  title: string;
  description?: string;
  projectId: string;
  status?: string;
  priority?: string;
  progress?: number;
  startDate: string;
  deadline: string;
};

export type UpdateMilestoneData =
  Partial<CreateMilestoneData>;

export const getMilestones = async (page = 1, limit = 10, search?: string, status?: string, priority?: string): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  if (status && status !== "ALL") params.status = status;
  if (priority && priority !== "ALL") params.priority = priority;
  const response = await api.get("/milestones", { params });
  return response.data.data;
};

export const getMilestone = async (
  id: string,
): Promise<Milestone> => {
  const response = await api.get(`/milestones/${id}`);
  return response.data.data;
};

export const createMilestone = async (
  data: CreateMilestoneData,
): Promise<Milestone> => {
  const response = await api.post("/milestones", data);
  return response.data.data;
};

export const updateMilestone = async (
  id: string,
  data: UpdateMilestoneData,
): Promise<Milestone> => {
  const response = await api.patch(
    `/milestones/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteMilestone = async (
  id: string,
) => {
  const response = await api.delete(`/milestones/${id}`);
  return response.data;
};
