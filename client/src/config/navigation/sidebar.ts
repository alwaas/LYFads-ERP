import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  CheckSquare,
  Flag,
  CalendarCheck,
  ClipboardList,
  FileText,
  Bell,
  History,
  Settings,
  UserRoundCheck,
  BarChart3,
  MessageSquare,
  TimerReset,
  Clock3,
  CreditCard,
  Paperclip,
  GitBranch,
  Receipt,
  Wallet,
  ShoppingCart,
  Store,
  TrendingUp,
  Package,
  Warehouse,
  ArrowLeftRight,
  Building2,
  Tag,
} from "lucide-react";

export type SidebarItem = {
  title: string;
  path: string;
  icon: any;
  roles: string[];
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },
  

  {
    title: "Employees",
    path: "/employees",
    icon: Users,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
    ],
  },

  {
    title: "Clients",
    path: "/clients",
    icon: Briefcase,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Projects",
    path: "/projects",
    icon: FolderKanban,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Kanban",
    path: "/projects/:projectId/kanban",
    icon: FolderKanban,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Tasks",
    path: "/tasks",
    icon: CheckSquare,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Milestones",
    path: "/milestones",
    icon: Flag,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Attendance",
    path: "/attendance",
    icon: CalendarCheck,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Leaves",
    path: "/leaves",
    icon: ClipboardList,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Daily Reports",
    path: "/daily-work-reports",
    icon: FileText,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Payroll",
    path: "/payroll",
    icon: Wallet,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "CRM",
    path: "/crm",
    icon: UserRoundCheck,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Reports",
    path: "/reports",
    icon: BarChart3,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Sales Report",
    path: "/reports/sales",
    icon: Receipt,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Receivables",
    path: "/reports/receivables",
    icon: Receipt,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Customers",
    path: "/reports/customers",
    icon: Briefcase,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Expenses",
    path: "/expenses",
    icon: Wallet,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Purchases",
    path: "/purchases",
    icon: ShoppingCart,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Purchase Orders",
    path: "/purchase-orders",
    icon: ShoppingCart,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Vendors",
    path: "/vendors",
    icon: Store,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Products",
    path: "/products",
    icon: Package,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Warehouses",
    path: "/warehouses",
    icon: Warehouse,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Stock Movements",
    path: "/stock-movements",
    icon: ArrowLeftRight,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Stock Counts",
    path: "/stock-counts",
    icon: ClipboardList,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Inventory Report",
    path: "/reports/inventory",
    icon: Package,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Inventory Settings",
    path: "/inventory-settings",
    icon: Settings,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
    ],
  },

  {
    title: "Profitability",
    path: "/reports/profitability",
    icon: TrendingUp,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Sales Orders",
    path: "/sales-orders",
    icon: ShoppingCart,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Invoices",
    path: "/invoices",
    icon: Receipt,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Notifications",
    path: "/notifications",
    icon: Bell,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Activity Logs",
    path: "/activity-logs",
    icon: History,
    roles: [
      "SUPER_ADMIN",
    ],
  },

  {
    title: "Comments",
    path: "/comments",
    icon: MessageSquare,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Timeline",
    path: "/timeline",
    icon: Clock3,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Timesheets",
    path: "/timesheets",
    icon: TimerReset,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Project Timeline",
    path: "/project-timeline",
    icon: GitBranch,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Payments",
    path: "/payments",
    icon: CreditCard,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
    ],
  },

  {
    title: "Attachments",
    path: "/attachments",
    icon: Paperclip,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
    ],
  },

  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
    roles: [
      "SUPER_ADMIN",
    ],
  },

  {
    title: "Tenant Management",
    path: "/tenants",
    icon: Building2,
    roles: [
      "SUPER_ADMIN",
    ],
  },

  {
    title: "Plan Management",
    path: "/plans",
    icon: Tag,
    roles: [
      "SUPER_ADMIN",
    ],
  },

  {
    title: "My Plan",
    path: "/my-plan",
    icon: CreditCard,
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
    ],
  },
];