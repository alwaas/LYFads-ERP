import api from "./api";
import type { User } from "../types/user";

export const getUsers = async (page = 1, limit = 10, search?: string) => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  const response = await api.get("/users", { params });
  return response.data.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

export const createUser = async (data: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) => {
  const response = await api.post("/users", data);
  return response.data.data;
};

export const updateUserRole = async (id: string, role: string) => {
  const response = await api.patch(`/users/${id}/role`, { role });
  return response.data.data;
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  const response = await api.patch(`/users/${id}/status`, { isActive });
  return response.data.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data.data;
};
