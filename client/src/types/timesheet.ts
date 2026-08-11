export type Timesheet = {
  id: string;

  employeeId: string;
  projectId?: string | null;
  taskId?: string | null;

  workDate: string;
  startTime?: string | null;
  endTime?: string | null;

  hours: number | string;

  description?: string | null;

  employee: {
    id: string;
    employeeCode: string;
    user: {
      fullName: string;
      email?: string;
    };
  };

  project?: {
    id: string;
    name: string;
  } | null;

  task?: {
    id: string;
    title: string;
    taskCode?: string;
  } | null;
};

export type CreateTimesheetPayload = {
  employeeId: string;
  projectId?: string;
  taskId?: string;
  workDate: string;
  startTime?: string;
  endTime?: string;
  hours: string;
  description?: string;
};

export type UpdateTimesheetPayload =
  Partial<CreateTimesheetPayload>;