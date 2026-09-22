import api from "./api";
import type {
  TimelineResponse,
} from "../types/timeline";

export const getTimeline = async (page = 1, limit = 10): Promise<any> => {
  const response = await api.get("/activity-logs", { params: { page, limit } });
  return response.data;
};

export const getTimelineResponse = async (page = 1, limit = 10): Promise<TimelineResponse> => {
  const response = await api.get("/activity-logs", { params: { page, limit } });
  const result = response.data;
  const items = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
  return {
    data: items,
    total: result?.total ?? items.length,
    page: result?.page ?? page,
    limit: result?.limit ?? limit,
  };
};
