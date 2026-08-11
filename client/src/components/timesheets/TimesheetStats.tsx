import type { Timesheet } from "../../types/timesheet";

type Props = {
  timesheets: Timesheet[];
};

export default function TimesheetStats({
  timesheets,
}: Props) {
  const totalEntries = timesheets.length;

  const totalHours = timesheets.reduce(
    (sum, item) =>
      sum + Number(item.hours || 0),
    0,
  );

  const averageHours =
    totalEntries > 0
      ? totalHours / totalEntries
      : 0;

  const employees = new Set(
    timesheets.map(
      (item) => item.employeeId,
    ),
  ).size;

  const stats = [
    {
      label: "Total Entries",
      value: totalEntries,
    },
    {
      label: "Total Hours",
      value: totalHours.toFixed(2),
    },
    {
      label: "Average Hours",
      value: averageHours.toFixed(2),
    },
    {
      label: "Employees",
      value: employees,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-gray-500">
            {stat.label}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
