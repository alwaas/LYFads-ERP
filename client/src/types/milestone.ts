export type MilestoneStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ON_HOLD";

export type MilestonePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type MilestoneProject = {
  id: string;
  projectCode: string;
  name: string;
};

export type Milestone = {
  id: string;
  title: string;
  description?: string | null;

  projectId: string;

  status: MilestoneStatus;
  priority: MilestonePriority;

  progress: number;

  startDate: string;
  deadline: string;

  createdAt: string;
  updatedAt: string;

  project?: MilestoneProject | null;
};