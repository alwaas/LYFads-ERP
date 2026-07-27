import type { Project } from "../../types/project";

type Props = {
  projects: Project[];
};

function ProjectStats({ projects }: Props) {
  const totalProjects = projects.length;

  const activeProjects = projects.filter(
    (project) => project.status === "ACTIVE"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "COMPLETED"
  ).length;

  const onHoldProjects = projects.filter(
    (project) => project.status === "ON_HOLD"
  ).length;

  const totalBudget = projects.reduce(
    (sum, project) =>
      sum + Number(project.budget ?? 0),
    0
  );

  const averageProgress =
    totalProjects > 0
      ? Math.round(
          projects.reduce(
            (sum, project) => sum + project.progress,
            0
          ) / totalProjects
        )
      : 0;

  const uniqueClients = new Set(
    projects.map((project) => project.client.id)
  ).size;

  const upcomingProjects = projects.filter(
    (project) =>
      project.status === "PLANNING" ||
      project.status === "ACTIVE"
  ).length;

  const cards = [
    {
      title: "Total Projects",
      value: totalProjects,
      color: "bg-blue-500",
    },
    {
      title: "Active",
      value: activeProjects,
      color: "bg-green-500",
    },
    {
      title: "Completed",
      value: completedProjects,
      color: "bg-purple-500",
    },
    {
      title: "On Hold",
      value: onHoldProjects,
      color: "bg-yellow-500",
    },
    {
      title: "Total Budget",
      value: `₹${totalBudget.toLocaleString()}`,
      color: "bg-indigo-500",
    },
    {
      title: "Average Progress",
      value: `${averageProgress}%`,
      color: "bg-cyan-500",
    },
    {
      title: "Clients",
      value: uniqueClients,
      color: "bg-pink-500",
    },
    {
      title: "Upcoming",
      value: upcomingProjects,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.color} text-white rounded-xl shadow p-5`}
        >
          <p className="text-sm opacity-90">
            {card.title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default ProjectStats;