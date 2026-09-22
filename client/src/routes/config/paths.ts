export const PATHS = {
  HOME: "/",
  LOGIN: "/login",

  DASHBOARD: "/dashboard",

  EMPLOYEES: "/employees",
  ADD_EMPLOYEE: "/employees/add",
  EDIT_EMPLOYEE: "/employees/edit/:id",
  VIEW_EMPLOYEE: "/employees/view/:id",

  CLIENTS: "/clients",
  ADD_CLIENT: "/clients/add",
  EDIT_CLIENT: "/clients/edit/:id",
  VIEW_CLIENT: "/clients/view/:id",

  PROJECTS: "/projects",
  ADD_PROJECT: "/projects/add",
  EDIT_PROJECT: "/projects/edit/:id",
  VIEW_PROJECT: "/projects/view/:id",
  KANBAN: "/projects/:projectId/kanban",

  TASKS: "/tasks",
  ADD_TASK: "/tasks/add",
  EDIT_TASK: "/tasks/edit/:id",
  VIEW_TASK: "/tasks/view/:id",

  ATTENDANCE: "/attendance",
  CHECK_IN: "/attendance/check-in",

  LEAVES: "/leaves",
  ADD_LEAVE: "/leaves/add",
  EDIT_LEAVE: "/leaves/edit/:id",
  VIEW_LEAVE: "/leaves/view/:id",

  DAILY_WORK_REPORTS: "/daily-work-reports",
  ADD_DAILY_WORK_REPORT: "/daily-work-reports/add",
  EDIT_DAILY_WORK_REPORT: "/daily-work-reports/edit/:id",
  VIEW_DAILY_WORK_REPORT: "/daily-work-reports/view/:id",

  PAYROLL: "/payroll",
  ADD_PAYROLL: "/payroll/add",
  EDIT_PAYROLL: "/payroll/edit/:id",
  VIEW_PAYROLL: "/payroll/view/:id",

  EXPENSES: "/expenses",
  ADD_EXPENSE: "/expenses/add",
  EDIT_EXPENSE: "/expenses/edit/:id",
  VIEW_EXPENSE: "/expenses/:id",

  PURCHASES: "/purchases",
  ADD_PURCHASE: "/purchases/add",
  EDIT_PURCHASE: "/purchases/edit/:id",
  VIEW_PURCHASE: "/purchases/:id",

  VENDORS: "/vendors",
  ADD_VENDOR: "/vendors/add",
  EDIT_VENDOR: "/vendors/edit/:id",
  VIEW_VENDOR: "/vendors/:id",

  PRODUCTS: "/products",
  ADD_PRODUCT: "/products/add",
  EDIT_PRODUCT: "/products/edit/:id",
  VIEW_PRODUCT: "/products/:id",

  WAREHOUSES: "/warehouses",
  ADD_WAREHOUSE: "/warehouses/add",
  EDIT_WAREHOUSE: "/warehouses/edit/:id",
  VIEW_WAREHOUSE: "/warehouses/:id",

  STOCK_MOVEMENTS: "/stock-movements",
  ADD_STOCK_MOVEMENT: "/stock-movements/add",
  VIEW_STOCK_MOVEMENT: "/stock-movements/:id",

  STOCK_COUNTS: "/stock-counts",
  ADD_STOCK_COUNT: "/stock-counts/add",
  VIEW_STOCK_COUNT: "/stock-counts/:id",

  INVENTORY_REPORT: "/reports/inventory",

  INVENTORY_SETTINGS: "/inventory-settings",

  USERS: "/users",
  ADD_USER: "/users/add",
  EDIT_USER: "/users/edit/:id",
  VIEW_USER: "/users/view/:id",

  NOTIFICATIONS: "/notifications",

  ACTIVITY_LOGS: "/activity-logs",

  SETTINGS: "/settings",

  CRM: "/crm",
  ADD_LEAD: "/crm/add",
  EDIT_LEAD: "/crm/edit/:id",
  VIEW_LEAD: "/crm/view/:id",

  REPORTS: "/reports",
  SALES_REPORT: "/reports/sales",
  RECEIVABLES_REPORT: "/reports/receivables",
  PAYABLES_REPORT: "/reports/payables",
  CUSTOMERS_REPORT: "/reports/customers",
  EXPENSE_REPORT: "/reports/expenses",
  PURCHASE_REPORT: "/reports/purchases",
  VENDOR_REPORT: "/reports/vendors",
  PROFITABILITY_REPORT: "/reports/profitability",

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
  EDIT_MILESTONE: "/milestones/edit/:id",
  VIEW_MILESTONE: "/milestones/view/:id",


} as const;