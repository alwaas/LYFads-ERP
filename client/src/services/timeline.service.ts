import api from "./api";
import type {
  TimelineItem,
  TimelineResponse,
} from "../types/timeline";

const extractTimelineData = (payload: unknown): TimelineItem[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as Record<string, unknown>;

  const candidates: unknown[] = [
    response.data,
    response,
  ];

  if (response.data && typeof response.data === "object") {
    const nested = response.data as Record<string, unknown>;

    candidates.push(
      nested.data,
      nested.items,
      nested.results,
    );
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as TimelineItem[];
    }
  }

  return [];
};

export const getTimeline = async (): Promise<TimelineItem[]> => {
  const response = await api.get("/activity-logs");

  return extractTimelineData(response.data);
};

export const getTimelineResponse =
  async (): Promise<TimelineResponse> => {
    const response = await api.get("/activity-logs");

    const items = extractTimelineData(response.data);

    return {
      data: items,
      total: items.length,
      page: 1,
      limit: items.length,
    };
  };
