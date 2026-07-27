import { Link } from "react-router-dom";

import type {
  DailyWorkReport,
} from "../../types/daily-work-report";

type Props = {
  reports: DailyWorkReport[];
  onDelete: (id: string) => void;
};

function DailyWorkReportTable({
  reports,
  onDelete,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-6 py-4 text-left">
              Employee
            </th>

            <th className="px-6 py-4 text-left">
              Date
            </th>

            <th className="px-6 py-4 text-left">
              Project
            </th>

            <th className="px-6 py-4 text-left">
              Hours
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-center">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {reports.length === 0 ? (

            <tr>

              <td
                colSpan={6}
                className="text-center py-12 text-gray-500"
              >
                No Daily Work Reports Found
              </td>

            </tr>

          ) : (

            reports.map((report) => (

              <tr
                key={report.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="px-6 py-4">
                  {report.employee.user.fullName}
                </td>

                <td className="px-6 py-4">
                  {new Date(
                    report.reportDate
                  ).toLocaleDateString()}
                </td>

                <td className="px-6 py-4">
                  {report.project?.name ?? "-"}
                </td>

                <td className="px-6 py-4">
                  {Number(
                    report.hoursWorked
                  ).toFixed(2)}
                </td>

                <td className="px-6 py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        report.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : report.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : report.status === "PLANNED"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                  >
                    {report.status}
                  </span>

                </td>

                <td className="px-6 py-4">

                  <div className="flex justify-center gap-2">

                    <Link
                      to={`/daily-work-reports/view/${report.id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </Link>

                    <Link
                      to={`/daily-work-reports/edit/${report.id}`}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() =>
                        onDelete(report.id)
                      }
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}

export default DailyWorkReportTable;