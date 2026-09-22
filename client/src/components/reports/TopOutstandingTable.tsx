import type { ReceivablesReport } from "../../types/report";

type Props = {
  customers: ReceivablesReport["topOutstandingCustomers"];
};

function TopOutstandingTable({ customers }: Props) {
  if (!customers.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-5">Top Outstanding Customers</h2>
        <p className="text-gray-500">No outstanding receivables.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Top Outstanding Customers</h2>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoices</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {customers.map((row) => (
            <tr key={row.clientId}>
              <td className="px-6 py-4 text-sm">{row.customerName}</td>
              <td className="px-6 py-4 text-sm text-right text-red-600">${row.outstanding.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-right">{row.invoiceCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TopOutstandingTable;
