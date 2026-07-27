import api from "./api";

export const getActivity = async () => {
  const response = await api.get("/dashboard/activity-summary");
  return response.data.data ?? response.data;
};