import api from "./api";

export const getDashboardStats = async () => {
  const { data } = await api.get("/dashboard/stats");
  return data.data;
};

export const getDashboardCharts = async () => {
  const { data } = await api.get("/dashboard/charts");
  return data.data;
};

export const getRecentProjects = async () => {
  const { data } = await api.get("/dashboard/recent-projects");
  return data.data;
};

export const getRecentTasks = async () => {
  const { data } = await api.get("/dashboard/recent-tasks");
  return data.data;
};

export const getPendingTasks = async () => {
  const { data } = await api.get("/dashboard/pending-tasks");
  return data.data;
};

export const getRecentActivities = async () => {
  const { data } = await api.get("/dashboard/recent-activities");
  return data.data;
};

export const getEmployeeWorkload = async () => {
  const response = await api.get("/dashboard/employee-workload");
  return response.data.data;
};

export const getPriorityChart = async () => {
  const response = await api.get("/dashboard/priority-chart");
  return response.data.data;
};

export const getProjectStatusChart = async () => {
  const response = await api.get("/dashboard/project-status-chart");
  return response.data.data;
};

export const getTaskStatusChart = async () => {
  const response = await api.get("/dashboard/task-status-chart");
  return response.data.data;
};

export const getUpcomingDeadlines = async () => {
  const response = await api.get("/dashboard/upcoming-deadlines");
  return response.data.data;
};
