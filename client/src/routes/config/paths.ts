export const PATHS = {
  HOME: "/",
  LOGIN: "/login",

  DASHBOARD: "/dashboard",

  EMPLOYEES: "/employees",
  ADD_EMPLOYEE: "/employees/add",
  EDIT_EMPLOYEE: "/employees/edit/:id",
  VIEW_EMPLOYEE: "/employees/:id",

  CLIENTS: "/clients",
  ADD_CLIENT: "/clients/add",
  EDIT_CLIENT: "/clients/edit/:id",
  VIEW_CLIENT: "/clients/:id",

  PROJECTS: "/projects",
  ADD_PROJECT: "/projects/add",
  EDIT_PROJECT: "/projects/edit/:id",
  VIEW_PROJECT: "/projects/:id",
  KANBAN: "/projects/:projectId/kanban",

  TASKS: "/tasks",
  ADD_TASK: "/tasks/add",
  EDIT_TASK: "/tasks/edit/:id",
  VIEW_TASK: "/tasks/:id",

  ATTENDANCE: "/attendance",

  LEAVES: "/leaves",
  ADD_LEAVE: "/leaves/add",
  EDIT_LEAVE: "/leaves/edit/:id",
  VIEW_LEAVE: "/leaves/:id",

  DAILY_WORK_REPORTS: "/daily-work-reports",
  ADD_DAILY_WORK_REPORT: "/daily-work-reports/add",
  EDIT_DAILY_WORK_REPORT: "/daily-work-reports/edit/:id",
  VIEW_DAILY_WORK_REPORT: "/daily-work-reports/:id",

  NOTIFICATIONS: "/notifications",

  ACTIVITY_LOGS: "/activity-logs",

  SETTINGS: "/settings",

  CRM: "/crm",
  ADD_LEAD: "/crm/add",
  EDIT_LEAD: "/crm/edit/:id",
  VIEW_LEAD: "/crm/:id",

  REPORTS: "/reports",

  COMMENTS: "/comments",
  ADD_COMMENT: "/comments/add",
  EDIT_COMMENT: "/comments/edit/:id",
  
  TIMELINE: "/timeline",

  TIMESHEETS: "/timesheets",
  ADD_TIMESHEET: "/timesheets/add",
  EDIT_TIMESHEET: "/timesheets/edit/:id",
  VIEW_TIMESHEET: "/timesheets/:id",
  
  MILESTONES: "/milestones",
  ADD_MILESTONE: "/milestones/add",
  EDIT_MILESTONE: "/milestones/:id/edit",
  VIEW_MILESTONE: "/milestones/:id",


} as const;