import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/dashboard.service";
import DashboardCard from "./DashboardCard";

type DashboardStatsData = {
  users: number;
  employees: number;
  clients: number;
  projects: number;
  tasks: number;
  completedTasks: number;
  pendingTasks: number;
};

function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        Loading Dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load dashboard.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      <DashboardCard
        title="Users"
        value={stats.users}
        color="bg-blue-600"
      />

      <DashboardCard
        title="Employees"
        value={stats.employees}
        color="bg-green-600"
      />

      <DashboardCard
        title="Projects"
        value={stats.projects}
        color="bg-purple-600"
      />

      <DashboardCard
        title="Tasks"
        value={stats.tasks}
        color="bg-orange-500"
      />

    </div>
  );
}

export default DashboardStats;