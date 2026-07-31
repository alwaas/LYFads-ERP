import api from "./api";

export const getDashboardStats = async () => {
  const { data } = await api.get("/dashboard/stats");
  return data;
};

export const getDashboardCharts = async () => {
  const { data } = await api.get("/dashboard/charts");
  return data;
};

export const getRecentProjects = async () => {
  const { data } = await api.get("/dashboard/recent-projects");
  return data;
};

export const getRecentTasks = async () => {
  const { data } = await api.get("/dashboard/recent-tasks");
  return data;
};

export const getRecentActivities = async () => {
  const { data } = await api.get("/dashboard/recent-activities");
  return data;
};