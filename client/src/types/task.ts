export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type Task = {
  id: string;

  taskCode: string;

  title: string;

  description?: string;

  status: TaskStatus;

  priority: TaskPriority;

  dueDate?: string;

  estimatedHours?: number;

  actualHours?: number;

  projectId: string;

  employeeId?: string;

  project: {
    id: string;
    name: string;
  };

  employee?: {
    id: string;
    employeeCode: string;

    user: {
      fullName: string;
    };
  };

  createdAt: string;

  updatedAt: string;
};