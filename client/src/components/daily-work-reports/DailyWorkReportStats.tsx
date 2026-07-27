import type { DailyWorkReport } from "../../types/daily-work-report";

type Props = {
  reports: DailyWorkReport[];
};

function DailyWorkReportStats({
  reports,
}: Props) {
  const totalReports = reports.length;

  const completedReports = reports.filter(
    (report) => report.status === "COMPLETED"
  ).length;

  const plannedReports = reports.filter(
    (report) => report.status === "PLANNED"
  ).length;

  const progressReports = reports.filter(
    (report) => report.status === "IN_PROGRESS"
  ).length;

  const blockedReports = reports.filter(
    (report) => report.status === "BLOCKED"
  ).length;

  const totalHours = reports.reduce(
    (sum, report) =>
      sum + Number(report.hoursWorked),
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">

      <div className="bg-white rounded-xl shadow border p-6">
        <h3 className="text-sm text-gray-500">
          Total Reports
        </h3>

        <p className="text-3xl font-bold mt-2">
          {totalReports}
        </p>
      </div>

      <div className="bg-green-50 rounded-xl shadow border border-green-200 p-6">
        <h3 className="text-sm text-green-700">
          Completed
        </h3>

        <p className="text-3xl font-bold mt-2 text-green-700">
          {completedReports}
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl shadow border border-blue-200 p-6">
        <h3 className="text-sm text-blue-700">
          In Progress
        </h3>

        <p className="text-3xl font-bold mt-2 text-blue-700">
          {progressReports}
        </p>
      </div>

      <div className="bg-yellow-50 rounded-xl shadow border border-yellow-200 p-6">
        <h3 className="text-sm text-yellow-700">
          Planned
        </h3>

        <p className="text-3xl font-bold mt-2 text-yellow-700">
          {plannedReports}
        </p>
      </div>

      <div className="bg-red-50 rounded-xl shadow border border-red-200 p-6">
        <h3 className="text-sm text-red-700">
          Blocked
        </h3>

        <p className="text-3xl font-bold mt-2 text-red-700">
          {blockedReports}
        </p>
      </div>

      <div className="bg-purple-50 rounded-xl shadow border border-purple-200 p-6">
        <h3 className="text-sm text-purple-700">
          Total Hours
        </h3>

        <p className="text-3xl font-bold mt-2 text-purple-700">
          {totalHours.toFixed(2)}
        </p>
      </div>

    </div>
  );
}

export default DailyWorkReportStats;