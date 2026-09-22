import api from "./api";
import type { Employee } from "../types/employee";

export const getEmployees = async (page = 1, limit = 10, search?: string): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  const response = await api.get("/employees", { params });
  return response.data.data;
};

export const getManagers = async (): Promise<Employee[]> => {
  const response = await api.get("/employees", { params: { page: 1, limit: 100 } });
  const data = response.data.data || [];
  return data.filter((e: Employee) => e.user?.role === "MANAGER");
};

export const getEmployee = async (
  id: string
): Promise<Employee> => {
  const response = await api.get(`/employees/${id}`);

  return response.data.data;
};

export const createEmployee = async (data: unknown) => {
  const response = await api.post("/employees", data);

  return response.data.data;
};

export const updateEmployee = async (
  id: string,
  data: unknown
) => {
  const response = await api.patch(`/employees/${id}`, data);

  return response.data.data;
};

export const deleteEmployee = async (id: string) => {
  const response = await api.delete(`/employees/${id}`);

  return response.data.data;
};

export const getMyProfile = async (userId: string): Promise<Employee | undefined> => {
  const response = await api.get("/employees", { params: { page: 1, limit: 100 } });
  const data = response.data.data || [];
  return data.find((e: Employee & { user: { id: string } }) => e.user.id === userId);
};

export const updateSelfProfile = async (data: unknown) => {
  const response = await api.patch("employees/profile/me", data);

  return response.data.data;
};
