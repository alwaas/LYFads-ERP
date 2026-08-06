import type { DashboardStats as DashboardStatsType } from "../../../types/dashboard";

type Props = {
  stats: DashboardStatsType;
};

function DashboardStats({ stats }: Props) {
  const cards = [
    {
      title: "Projects",
      value: stats.totalProjects,
    },
    {
      title: "Tasks",
      value: stats.totalTasks,
    },
    {
      title: "Employees",
      value: stats.totalEmployees,
    },
    {
      title: "Clients",
      value: stats.totalClients,
    },
    {
      title: "Completed Projects",
      value: stats.completedProjects,
    },
    {
      title: "Revenue",
      value: `₹${stats.totalRevenue}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl shadow border p-6"
        >
          <p className="text-sm text-slate-500">
            {card.title}
          </p>

          <h2 className="text-3xl font-bold mt-3">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;