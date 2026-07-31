import api from "./api";

export const getDashboardReport = async () => {
  const { data } = await api.get("/reports/dashboard");

  return data.data;
};