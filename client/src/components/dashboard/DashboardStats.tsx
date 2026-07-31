import {
  Users,
  Briefcase,
  FolderKanban,
  CheckSquare,
  CalendarCheck,
  FileText,
  Bell,
  BarChart3,
} from "lucide-react";

import StatCard from "./StatCard";

type Props = {
  stats: {
    employees: number;
    clients: number;
    projects: number;
    tasks: number;
    attendance: number;
    leaves: number;
    notifications: number;
    reports: number;
  };
};

function DashboardStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      <StatCard
        title="Employees"
        value={stats.employees}
        subtitle="Total Employees"
        icon={<Users size={28} />}
        color="bg-blue-600"
      />

      <StatCard
        title="Clients"
        value={stats.clients}
        subtitle="Active Clients"
        icon={<Briefcase size={28} />}
        color="bg-green-600"
      />

      <StatCard
        title="Projects"
        value={stats.projects}
        subtitle="Running Projects"
        icon={<FolderKanban size={28} />}
        color="bg-purple-600"
      />

      <StatCard
        title="Pending Tasks"
        value={stats.tasks}
        subtitle="Pending Tasks"
        icon={<CheckSquare size={28} />}
        color="bg-orange-500"
      />

      <StatCard
        title="Attendance"
        value={`${stats.attendance}%`}
        subtitle="Today's Attendance"
        icon={<CalendarCheck size={28} />}
        color="bg-cyan-600"
      />

      <StatCard
        title="Leaves"
        value={stats.leaves}
        subtitle="Pending Leaves"
        icon={<FileText size={28} />}
        color="bg-yellow-500"
      />

      <StatCard
        title="Notifications"
        value={stats.notifications}
        subtitle="Unread Notifications"
        icon={<Bell size={28} />}
        color="bg-red-500"
      />

      <StatCard
        title="Reports"
        value={stats.reports}
        subtitle="Generated Reports"
        icon={<BarChart3 size={28} />}
        color="bg-indigo-600"
      />

    </div>
  );
}

export default DashboardStats;