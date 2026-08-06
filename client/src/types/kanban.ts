export type KanbanTaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export type KanbanTaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface KanbanUser {
  id: string;
  fullName: string;
  email: string;
}

export interface KanbanEmployee {
  id: string;
  employeeCode: string;
  user: KanbanUser;
}

export interface KanbanTask {
  id: string;

  taskCode: string;

  title: string;

  description?: string;

  status: KanbanTaskStatus;

  priority: KanbanTaskPriority;

  dueDate?: string;

  estimatedHours?: number;

  actualHours?: number;

  projectId: string;

  employeeId?: string;

  employee?: KanbanEmployee;

  createdAt: string;

  updatedAt: string;
}

export interface MoveTaskDto {
  status: KanbanTaskStatus;
}

export interface KanbanStatistics {
  status: KanbanTaskStatus;
  _count: {
    status: number;
  };
}