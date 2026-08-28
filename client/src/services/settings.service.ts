import api from "./api";

export interface Settings {
  id: string;
  name: string;
  slug: string;
  status: string;
  maxUsers: number;
  maxStorage: number;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export const getSettings = async (): Promise<Settings> => {
  const response = await api.get("/settings");
  return response.data.data;
};

export const updateSettings = async (data: Partial<Settings>) => {
  const response = await api.patch("/settings", data);
  return response.data.data;
};
