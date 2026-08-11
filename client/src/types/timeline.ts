export type TimelineModule =
  | "PROJECT"
  | "TASK"
  | "MILESTONE"
  | "EMPLOYEE"
  | "CLIENT"
  | "ATTENDANCE"
  | "LEAVE"
  | "DAILY_WORK_REPORT"
  | "CRM"
  | "TIMESHEET"
  | "COMMENT"
  | "NOTIFICATION"
  | "SYSTEM"
  | string;

export type TimelineAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "ASSIGN"
  | "COMPLETE"
  | "STATUS_CHANGE"
  | string;

export type TimelineUser = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

export type TimelineItem = {
  id: string;
  action: TimelineAction;
  module: TimelineModule;
  description: string;
  userId?: string;
  user?: TimelineUser | null;
  createdAt: string;

  entityId?: string | null;
  entityType?: string | null;

  metadata?: Record<string, unknown> | null;
};

export type TimelineFilters = {
  module: string;
  action: string;
  search: string;
  dateFrom: string;
  dateTo: string;
};

export type TimelineResponse = {
  data: TimelineItem[];
  total?: number;
  page?: number;
  limit?: number;
};
