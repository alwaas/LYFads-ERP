import api from "./api";

export type LoginDto = {
  email: string;
  password: string;
};

export const login = async (data: LoginDto) => {
  const response = await api.post("/auth/login", data);

  console.log("AUTH API RESPONSE:", JSON.stringify(response.data, null, 2));

  return response.data;
};