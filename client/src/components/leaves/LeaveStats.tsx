import type { Leave } from "../../types/leave";

type LeaveBalance = {
  id: string;
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  year: number;
};

type Props = {
  leaves: Leave[];
  balances?: LeaveBalance[];
};

function LeaveStats({
  leaves,
  balances = [],
}: Props) {
  const totalLeaves = leaves.length;

  const pendingLeaves = leaves.filter(
    (leave) =>
      leave.status === "PENDING"
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) =>
      leave.status === "APPROVED"
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) =>
      leave.status === "REJECTED"
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

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

      {balances.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 border">
          <h3 className="text-lg font-bold mb-4">Leave Balances</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Leave Type</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Used</th>
                  <th className="px-4 py-2 text-left">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance) => (
                  <tr key={balance.id} className="border-b">
                    <td className="px-4 py-2">{balance.leaveType}</td>
                    <td className="px-4 py-2">{balance.total}</td>
                    <td className="px-4 py-2">{balance.used}</td>
                    <td className="px-4 py-2 font-semibold">{balance.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveStats;
