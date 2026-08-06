import api from "./api";

import type {
  KanbanTask,
  MoveTaskDto,
  KanbanStatistics,
} from "../types/kanban";

/* ===========================
   GET BOARD
=========================== */

export const getKanbanBoard = async (
  projectId: string
): Promise<KanbanTask[]> => {
  const response = await api.get(
    `/kanban/project/${projectId}`
  );

  return response.data;
};

/* ===========================
   MOVE TASK
=========================== */

export const moveTask = async (
  taskId: string,
  data: MoveTaskDto
): Promise<KanbanTask> => {
  const response = await api.patch(
    `/kanban/task/${taskId}/move`,
    data
  );

  return response.data;
};

/* ===========================
   GET STATISTICS
=========================== */

export const getKanbanStatistics = async (
  projectId: string
): Promise<KanbanStatistics[]> => {
  const response = await api.get(
    `/kanban/statistics/${projectId}`
  );

  return response.data;
};