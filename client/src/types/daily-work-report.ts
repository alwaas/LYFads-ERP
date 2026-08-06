export type WorkStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED";

export interface DailyWorkReport {
  id: string;

  reportDate: string;

  yesterdayWork?: string;

  todayWork: string;

  tomorrowPlan?: string;

  hoursWorked: number;

  status: WorkStatus;

  managerRemarks?: string;

  employeeId: string;

  projectId?: string;

  taskId?: string;

  createdAt: string;

  updatedAt: string;

  employee: {
    id: string;
    employeeCode: string;

    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };

  project?: {
    id: string;
    name: string;
  } | null;

  task?: {
    id: string;
    title: string;
  } | null;
}

export interface CreateDailyWorkReportDto {
  reportDate: string;

  yesterdayWork?: string;

  todayWork: string;

  tomorrowPlan?: string;

  hoursWorked: number;

  status: WorkStatus;

  managerRemarks?: string;

  employeeId: string;

  projectId?: string;

  taskId?: string;
}

export interface UpdateDailyWorkReportDto
  extends Partial<CreateDailyWorkReportDto> {}