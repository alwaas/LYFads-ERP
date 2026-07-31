type DashboardOverviewProps = {
  employees: number;
  clients: number;
  projects: number;
  tasks: number;
};

const cards = [
  {
    key: "employees",
    title: "Employees",
  },
  {
    key: "clients",
    title: "Clients",
  },
  {
    key: "projects",
    title: "Projects",
  },
  {
    key: "tasks",
    title: "Tasks",
  },
] as const;

function DashboardOverview({
  employees,
  clients,
  projects,
  tasks,
}: DashboardOverviewProps) {
  const values = {
    employees,
    clients,
    projects,
    tasks,
  };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border bg-white p-6 shadow-sm"
        >
          <p className="text-sm text-slate-500">
            {card.title}
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            {values[card.key]}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default DashboardOverview;