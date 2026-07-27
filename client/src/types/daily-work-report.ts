export type WorkStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED";

export interface DailyWorkReport {
  id: string;

  employeeId: string;

  employee: {
    id: string;
    employeeCode: string;

    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };

  projectId?: string | null;

  project?: {
    id: string;
    name: string;
  } | null;

  taskId?: string | null;

  task?: {
    id: string;
    title: string;
  } | null;

  reportDate: string;

  yesterdayWork?: string;

  todayWork: string;

  tomorrowPlan?: string;

  hoursWorked: number;

  status: WorkStatus;

  managerRemarks?: string;

  createdAt: string;

  updatedAt: string;
}

export interface CreateDailyWorkReportDto {
  employeeId: string;

  projectId?: string;

  taskId?: string;

  reportDate: string;

  yesterdayWork?: string;

  todayWork: string;

  tomorrowPlan?: string;

  hoursWorked: number;

  status?: WorkStatus;

  managerRemarks?: string;
}