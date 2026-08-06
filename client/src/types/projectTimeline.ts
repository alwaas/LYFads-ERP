export interface TimelineUser {
  id: string;
  fullName: string;
  email: string;
}

export interface TimelineEmployee {
  id: string;
  user: TimelineUser;
}

export interface TimelineTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  employee?: TimelineEmployee;
}

export interface TimelineMilestone {
  id: string;
  title: string;
  deadline?: string;
  startDate?: string;
  completedAt?: string | null;
}

export interface ProjectTimeline {
  id: string;

  projectCode: string;

  name: string;

  status: string;

  priority: string;

  milestones: TimelineMilestone[];

  tasks: TimelineTask[];
}