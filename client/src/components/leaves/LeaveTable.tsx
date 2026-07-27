import { Link } from "react-router-dom";
import type { Leave } from "../../types/leave";

type Props = {
  leaves: Leave[];
  onDelete: (id: string) => void;
};

function LeaveTable({
  leaves,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-6 py-4 text-left">
              Employee
            </th>

            <th className="px-6 py-4 text-left">
              Leave Type
            </th>

            <th className="px-6 py-4 text-left">
              From
            </th>

            <th className="px-6 py-4 text-left">
              To
            </th>

            <th className="px-6 py-4 text-left">
              Days
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

          {leaves.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="text-center py-12 text-gray-500"
              >
                No Leave Requests Found
              </td>

            </tr>

          ) : (

            leaves.map((leave) => (

              <tr
                key={leave.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="px-6 py-4">

                  {leave.employee.user.fullName}

                </td>

                <td className="px-6 py-4">

                  {leave.leaveType}

                </td>

                <td className="px-6 py-4">

                  {new Date(
                    leave.fromDate
                  ).toLocaleDateString()}

                </td>

                <td className="px-6 py-4">

                  {new Date(
                    leave.toDate
                  ).toLocaleDateString()}

                </td>

                <td className="px-6 py-4">

                  {leave.totalDays}

                </td>

                <td className="px-6 py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      leave.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : leave.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {leave.status}
                  </span>

                </td>

                <td className="px-6 py-4">

                  <div className="flex justify-center gap-2">

                    <Link
                      to={`/leaves/view/${leave.id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </Link>

                    <Link
                      to={`/leaves/edit/${leave.id}`}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() =>
                        onDelete(leave.id)
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

export default LeaveTable;