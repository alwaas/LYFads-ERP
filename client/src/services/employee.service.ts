import api from "./api";
import type { Employee } from "../types/employee";

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get("/employees");

  return response.data.data.data;
};

export const getEmployee = async (
  id: string
): Promise<Employee> => {
  const response = await api.get(`/employees/${id}`);

  return response.data.data;
};

export const createEmployee = async (
  data: unknown
) => {
  const response = await api.post(
    "/employees",
    data
  );

  return response.data;
};

export const updateEmployee = async (
  id: string,
  data: unknown
) => {
  const response = await api.patch(
    `/employees/${id}`,
    data
  );

  return response.data;
};

export const deleteEmployee = async (
  id: string
) => {
  const response = await api.delete(
    `/employees/${id}`
  );

  return response.data;
};