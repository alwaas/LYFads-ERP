import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Eye, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Timesheet } from "../../types/timesheet";
import {
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
} from "../../services/timesheet.service";

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
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleSubmit = async (id: string) => {
    try {
      await submitTimesheet(id);
      toast.success("Timesheet submitted.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to submit timesheet.");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveTimesheet(id);
      toast.success("Timesheet approved.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to approve timesheet.");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    try {
      await rejectTimesheet(id, rejectionReason);
      toast.success("Timesheet rejected.");
      setRejectingId(null);
      setRejectionReason("");
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to reject timesheet.");
    }
  };

  if (!timesheets.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-500">
          No timesheets found.
        </p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

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

              <th className="px-5 py-3 font-semibold text-gray-700">
                Status
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
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[timesheet.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {timesheet.status}
                  </span>
                  {timesheet.status === "REJECTED" && timesheet.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">
                      {timesheet.rejectionReason}
                    </p>
                  )}
                  {timesheet.approvedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      By {timesheet.approvedBy.fullName}
                    </p>
                  )}
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

                    {timesheet.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => handleSubmit(timesheet.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-green-600"
                        title="Submit"
                      >
                        Submit
                      </button>
                    )}

                    {timesheet.status === "SUBMITTED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(timesheet.id)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-green-600"
                          title="Approve"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(timesheet.id)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                          title="Reject"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {rejectingId === timesheet.id && (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason"
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleReject(timesheet.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Confirm Reject"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          title="Cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <Link
                      to={`/timesheets/edit/${timesheet.id}`}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === timesheet.id}
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
