import type { DashboardReport } from "../../types/report";

type Props = {
  report: DashboardReport;
};

function ReportStats({
  report,
}: Props) {
  const cards = [
    {
      title: "Employees",
      value: report.employees,
    },
    {
      title: "Clients",
      value: report.clients,
    },
    {
      title: "Projects",
      value: report.projects,
    },
    {
      title: "Tasks",
      value: report.tasks,
    },
    {
      title: "Leads",
      value: report.leads,
    },
    {
      title: "Attendance",
      value: report.attendance,
    },
    {
      title: "Leaves",
      value: report.leaves,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow p-6"
        >
          <p className="text-sm text-gray-500">
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

export default ReportStats;