import api from "./api";
import type {
  TimelineResponse,
} from "../types/timeline";

export const getTimeline = async (page = 1, limit = 10): Promise<any> => {
  const response = await api.get("/activity-logs", { params: { page, limit } });
  return response.data.data;
};

export const getTimelineResponse =
  async (): Promise<TimelineResponse> => {
    const response = await api.get("/activity-logs");
    const result = response.data.data;
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  };
