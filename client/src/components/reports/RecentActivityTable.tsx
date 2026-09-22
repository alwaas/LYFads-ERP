import type { CustomerReport } from "../../types/report";

type Props = {
  payments: CustomerReport["paymentHistory"];
};

function RecentActivityTable({ payments }: Props) {
  if (!payments.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-5">Recent Financial Activity</h2>
        <p className="text-gray-500">No recent payments.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Recent Financial Activity</h2>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-6 py-4 text-sm">{new Date(p.paymentDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-sm">{p.customerName}</td>
              <td className="px-6 py-4 text-sm">{p.invoiceNumber || "-"}</td>
              <td className="px-6 py-4 text-sm text-right text-green-600">${p.amount.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm">{p.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentActivityTable;
