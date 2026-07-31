export interface DashboardStats {
  users: number;

  employees: {
    total: number;
    active: number;
    inactive: number;
  };

  clients: number;

  projects: {
    total: number;
    active: number;
    completed: number;
  };

  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface ChartData {
  projectStatus: {
    name: string;
    value: number;
  }[];

  taskStatus: {
    name: string;
    value: number;
  }[];
}