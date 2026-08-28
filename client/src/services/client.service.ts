import api from "./api";
import type { Client } from "../types/client";

export const getClients = async (page = 1, limit = 10, search?: string): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  const response = await api.get("/clients", { params });
  return response.data.data;
};

export const getClient = async (
  id: string
): Promise<Client> => {
  const response = await api.get(`/clients/${id}`);
  return response.data.data;
};

export const createClient = async (
  data: unknown
) => {
  const response = await api.post(
    "/clients",
    data
  );

  return response.data;
};

export const updateClient = async (
  id: string,
  data: unknown
) => {
  const response = await api.patch(
    `/clients/${id}`,
    data
  );

  return response.data;
};

export const deleteClient = async (
  id: string
) => {
  const response = await api.delete(
    `/clients/${id}`
  );

  return response.data;
};
