import type { LeaveStatus } from "../../types/leave";

type Props = {
  status: LeaveStatus;
};

function LeaveStatusBadge({ status }: Props) {
  const colors: Record<LeaveStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-200 text-gray-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default LeaveStatusBadge;
