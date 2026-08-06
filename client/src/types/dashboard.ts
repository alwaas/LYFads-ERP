export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  totalEmployees: number;
  totalClients: number;

  completedProjects: number;
  activeProjects: number;

  completedTasks: number;
  pendingTasks: number;

  totalRevenue: number;
}

export interface TaskStatusData {
  status: string;
  count: number;
}

export interface ProjectStatusData {
  status: string;
  count: number;
}

export interface PriorityData {
  priority: string;
  count: number;
}

export interface EmployeeWorkload {
  employeeId: string;
  employeeName: string;
  totalTasks: number;
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: string;
  projectName: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  module: string;
  description: string;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;

  taskStatus: TaskStatusData[];

  projectStatus: ProjectStatusData[];

  priorities: PriorityData[];

  workload: EmployeeWorkload[];

  deadlines: UpcomingDeadline[];

  recentActivities: RecentActivity[];
}