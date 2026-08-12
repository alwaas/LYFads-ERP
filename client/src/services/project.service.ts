import api from "./api";
import type { Project } from "../types/project";

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get("/projects");
  return response.data.data.data;
};

export const getProject = async (
  id: string
): Promise<Project> => {
  const response = await api.get(`/projects/${id}`);
  return response.data.data;
};

export const createProject = async (data: unknown) => {
  const response = await api.post("/projects", data);
  return response.data;
};

export const updateProject = async (
  id: string,
  data: unknown
) => {
  const response = await api.patch(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: string) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

export const projectService = {
  getAllProjects: getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};