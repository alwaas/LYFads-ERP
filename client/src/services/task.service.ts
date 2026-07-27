import api from "./api";

import type { Task } from "../types/task";

export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get("/tasks");

  return response.data.data.data;
};

export const getTask = async (
  id: string
): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);

  return response.data.data;
};

export const createTask = async (
  data: unknown
) => {
  const response = await api.post(
    "/tasks",
    data
  );

  return response.data;
};

export const updateTask = async (
  id: string,
  data: unknown
) => {
  const response = await api.patch(
    `/tasks/${id}`,
    data
  );

  return response.data;
};

export const deleteTask = async (
  id: string
) => {
  const response = await api.delete(
    `/tasks/${id}`
  );

  return response.data;
};