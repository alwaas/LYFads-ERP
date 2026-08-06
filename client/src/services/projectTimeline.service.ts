import api from "./api";
import type { ProjectTimeline } from "../types/projectTimeline";

export async function getProjectTimeline(
  projectId: string
): Promise<ProjectTimeline> {
  const res = await api.get(
    `/project-timeline/${projectId}`
  );

  return res.data.data;
}