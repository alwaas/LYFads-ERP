import api from "./api";

export const getDashboardCharts = async () => {
  const response = await api.get("/dashboard/charts");

  return response.data.data ?? response.data;
};