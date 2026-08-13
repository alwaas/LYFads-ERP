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
      "CLIENT",
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
      "CLIENT",
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
      "CLIENT",
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
      "ADMIN",
    ],
  },
];