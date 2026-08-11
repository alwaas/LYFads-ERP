import { Link } from "react-router-dom";
import { Pencil, Eye, Trash2 } from "lucide-react";
import type { Timesheet } from "../../types/timesheet";

type Props = {
  timesheets: Timesheet[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
};

export default function TimesheetTable({
  timesheets,
  onDelete,
  deletingId,
}: Props) {
  if (!timesheets.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-500">
          No timesheets found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-5 py-3 font-semibold text-gray-700">
                Employee
              </th>

              <th className="px-5 py-3 font-semibold text-gray-700">
                Date
              </th>

              <th className="px-5 py-3 font-semibold text-gray-700">
                Project
              </th>

              <th className="px-5 py-3 font-semibold text-gray-700">
                Task
              </th>

              <th className="px-5 py-3 font-semibold text-gray-700">
                Hours
              </th>

              <th className="px-5 py-3 text-right font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {timesheets.map((timesheet) => (
              <tr
                key={timesheet.id}
                className="hover:bg-gray-50"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900">
                    {timesheet.employee?.user?.fullName ||
                      "Unknown"}
                  </div>

                  <div className="text-xs text-gray-500">
                    {timesheet.employee?.employeeCode ||
                      "-"}
                  </div>
                </td>

                <td className="px-5 py-4 whitespace-nowrap text-gray-700">
                  {new Date(
                    timesheet.workDate,
                  ).toLocaleDateString()}
                </td>

                <td className="px-5 py-4 text-gray-700">
                  {timesheet.project?.name || "-"}
                </td>

                <td className="px-5 py-4 text-gray-700">
                  {timesheet.task?.title || "-"}
                </td>

                <td className="px-5 py-4 font-semibold text-gray-900">
                  {Number(
                    timesheet.hours || 0,
                  ).toFixed(2)}
                  h
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/timesheets/view/${timesheet.id}`}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                      title="View"
                    >
                      <Eye size={17} />
                    </Link>

                    <Link
                      to={`/timesheets/edit/${timesheet.id}`}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </Link>

                    <button
                      type="button"
                      disabled={
                        deletingId === timesheet.id
                      }
                      onClick={() =>
                        onDelete(timesheet.id)
                      }
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
