import type { Leave } from "../../types/leave";

type Props = {
  leaves: Leave[];
};

function LeaveStats({
  leaves,
}: Props) {
  const totalLeaves = leaves.length;

  const pendingLeaves = leaves.filter(
    (leave) =>
      leave.status === "PENDING"
  ).length;

  const approvedLeaves =
    leaves.filter(
      (leave) =>
        leave.status ===
        "APPROVED"
    ).length;

  const rejectedLeaves =
    leaves.filter(
      (leave) =>
        leave.status ===
        "REJECTED"
    ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="bg-white rounded-xl shadow p-6 border">

        <h3 className="text-gray-500 text-sm">
          Total Leave Requests
        </h3>

        <p className="text-3xl font-bold mt-2">
          {totalLeaves}
        </p>

      </div>

      <div className="bg-yellow-50 rounded-xl shadow p-6 border border-yellow-200">

        <h3 className="text-yellow-700 text-sm">
          Pending
        </h3>

        <p className="text-3xl font-bold mt-2 text-yellow-700">
          {pendingLeaves}
        </p>

      </div>

      <div className="bg-green-50 rounded-xl shadow p-6 border border-green-200">

        <h3 className="text-green-700 text-sm">
          Approved
        </h3>

        <p className="text-3xl font-bold mt-2 text-green-700">
          {approvedLeaves}
        </p>

      </div>

      <div className="bg-red-50 rounded-xl shadow p-6 border border-red-200">

        <h3 className="text-red-700 text-sm">
          Rejected
        </h3>

        <p className="text-3xl font-bold mt-2 text-red-700">
          {rejectedLeaves}
        </p>

      </div>

    </div>
  );
}

export default LeaveStats;