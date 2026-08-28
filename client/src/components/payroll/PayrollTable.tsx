import type { Payroll } from "../../types/payroll";

type Props = {
  payrolls: Payroll[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onProcess?: (id: string) => void;
  onApprove?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
};

function PayrollTable({ payrolls, onView, onEdit, onDelete, onProcess, onApprove, onMarkPaid }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  if (payrolls.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">No payroll records found.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PROCESSED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    PAID: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 font-medium text-slate-500">Employee</th>
            <th className="px-4 py-3 font-medium text-slate-500">Code</th>
            <th className="px-4 py-3 font-medium text-slate-500">Period</th>
            <th className="px-4 py-3 font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 font-medium text-slate-500">Net Salary</th>
            <th className="px-4 py-3 font-medium text-slate-500">Created</th>
            <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map((payroll) => (
            <tr key={payroll.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {payroll.employee?.user?.fullName || "-"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {payroll.employee?.employeeCode || "-"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {payroll.month}/{payroll.year}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[payroll.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {payroll.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-900">
                {formatCurrency(Number(payroll.netSalary))}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {new Date(payroll.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onView(payroll.id)}
                    className="text-slate-600 hover:text-blue-600"
                    title="View"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(payroll.id)}
                    className="text-slate-600 hover:text-blue-600"
                    title="Edit"
                  >
                    Edit
                  </button>
                  {payroll.status === "PENDING" && onProcess && (
                    <button
                      onClick={() => onProcess(payroll.id)}
                      className="text-slate-600 hover:text-green-600"
                      title="Process"
                    >
                      Process
                    </button>
                  )}
                  {payroll.status === "PROCESSED" && onApprove && (
                    <button
                      onClick={() => onApprove(payroll.id)}
                      className="text-slate-600 hover:text-green-600"
                      title="Approve"
                    >
                      Approve
                    </button>
                  )}
                  {payroll.status === "APPROVED" && onMarkPaid && (
                    <button
                      onClick={() => onMarkPaid(payroll.id)}
                      className="text-slate-600 hover:text-green-600"
                      title="Mark Paid"
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(payroll.id)}
                    className="text-slate-600 hover:text-red-600"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PayrollTable;
