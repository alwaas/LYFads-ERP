import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { Leave } from "../../types/leave";

type Props = {
  leaves: Leave[];
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
};

function LeaveTable({
  leaves,
  onDelete,
  onApprove,
  onReject,
}: Props) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectionReason("");
  };

  const confirmReject = (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    onReject?.(id, rejectionReason);
    setRejectingId(null);
    setRejectionReason("");
  };

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">

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
                    leave.startDate
                  ).toLocaleDateString()}

                </td>

                <td className="px-6 py-4">

                  {new Date(
                    leave.endDate
                  ).toLocaleDateString()}

                </td>

                <td className="px-6 py-4">
                    {Math.ceil(
                        (new Date(leave.endDate).getTime() -
                        new Date(leave.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}
                </td>

                <td className="px-6 py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    leave.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : leave.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : leave.status === "CANCELLED"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {leave.status}
                  </span>

                  {leave.status === "REJECTED" && leave.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">
                      {leave.rejectionReason}
                    </p>
                  )}

                  {leave.leaveBalance && (
                    <p className="text-xs text-slate-500 mt-1">
                      Balance: {leave.leaveBalance.remaining}
                    </p>
                  )}

                </td>

                <td className="px-6 py-4">

                  <div className="flex justify-center gap-2">

                    <Link
                      to={`/leaves/view/${leave.id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </Link>

                    {leave.status === "PENDING" && onApprove && (
                      <button
                        onClick={() => onApprove(leave.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}

                    {leave.status === "PENDING" && onReject && rejectingId !== leave.id && (
                      <button
                        onClick={() => handleRejectClick(leave.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    )}

                    {rejectingId === leave.id && (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason"
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => confirmReject(leave.id)}
                          className="px-2 py-1 bg-red-700 text-white rounded text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <Link
                      to={`/leaves/edit/${leave.id}`}
                      className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
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
