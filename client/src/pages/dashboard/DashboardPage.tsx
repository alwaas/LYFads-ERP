import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardStats from "../../components/dashboard/DashboardStats";
import DashboardCharts from "../../components/dashboard/DashboardCharts";
import RecentProjects from "../../components/dashboard/RecentProjects";
import RecentTasks from "../../components/dashboard/RecentTasks";
import ActivityFeed from "../../components/dashboard/ActivityFeed";

function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">

        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <DashboardStats />

        <DashboardCharts />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentProjects />
          <RecentTasks />
        </div>

          <ActivityFeed />
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;