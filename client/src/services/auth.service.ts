import api from "./api";

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  fullName: string;
  email: string;
  password: string;
  role: string;
  tenantId: string;
};

export const login = async (data: LoginDto) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const register = async (data: RegisterDto) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const logout = async () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};