import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "../../layouts/DashboardLayout";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardStats from "../../components/dashboard/DashboardStats";
import DashboardCharts from "../../components/dashboard/DashboardCharts";

import EmployeeWorkload from "../../components/dashboard/analytics/EmployeeWorkload";
import PriorityChart from "../../components/dashboard/analytics/PriorityChart";
import UpcomingDeadlines from "../../components/dashboard/analytics/UpcomingDeadlines";

import RecentProjects from "../../components/dashboard/RecentProjects";
import RecentTasks from "../../components/dashboard/RecentTasks";
import PendingTasks from "../../components/dashboard/PendingTasks";
import ActivityFeed from "../../components/dashboard/ActivityFeed";

import { getDashboardStats } from "../../services/dashboard.service";


function DashboardPage() {

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });


  const dashboard = data;


  const stats = {
    employees:
      dashboard?.employees?.total ?? 0,

    clients:
      dashboard?.clients ?? 0,

    projects:
      dashboard?.projects?.total ?? 0,

    tasks:
      dashboard?.tasks?.pending ?? 0,

    attendance: 0,

    leaves: 0,

    notifications: 0,

    reports: 0,
  };


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }


  if (isError) {
    return (
      <DashboardLayout>
        <div className="p-6">
          Failed to load dashboard.
        </div>
      </DashboardLayout>
    );
  }


  return (
  <DashboardLayout>
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <DashboardHeader />

      <DashboardStats
        stats={stats}
      />

      <DashboardCharts />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EmployeeWorkload />
        <PriorityChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UpcomingDeadlines />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentProjects />
        <RecentTasks />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PendingTasks />
        <ActivityFeed />
      </div>

    </div>
  </DashboardLayout>
  );
}


export default DashboardPage;