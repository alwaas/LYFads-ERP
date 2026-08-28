import api from "./api";
import type { Payroll, PaymentMethod } from "../types/payroll";

export const getPayrolls = async (page = 1, limit = 10, search?: string): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  const response = await api.get("/payroll", { params });
  return response.data.data;
};

export const getPayroll = async (id: string): Promise<Payroll> => {
  const response = await api.get(`/payroll/${id}`);
  return response.data.data;
};

export const createPayroll = async (data: unknown) => {
  const response = await api.post("/payroll", data);
  return response.data.data;
};

export const updatePayroll = async (id: string, data: unknown) => {
  const response = await api.patch(`/payroll/${id}`, data);
  return response.data.data;
};

export const deletePayroll = async (id: string) => {
  const response = await api.delete(`/payroll/${id}`);
  return response.data.data;
};

export const processPayroll = async (id: string) => {
  const response = await api.post(`/payroll/${id}/process`);
  return response.data.data;
};

export const approvePayroll = async (id: string) => {
  const response = await api.post(`/payroll/${id}/approve`);
  return response.data.data;
};

export const markPayrollPaid = async (id: string, paymentMethod: PaymentMethod, paymentReference?: string) => {
  const response = await api.post(`/payroll/${id}/mark-paid`, { paymentMethod, paymentReference });
  return response.data.data;
};
