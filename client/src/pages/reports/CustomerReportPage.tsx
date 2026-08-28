import { useState, useEffect } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import DateRangeSelector from "../../components/reports/DateRangeSelector";

import {
  getCustomerReport,
} from "../../services/report.service";

import type { CustomerReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function CustomerReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<CustomerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined;
      const result = await getCustomerReport(params);
      setData(result);
    } catch (err) {
      setError("Failed to load customer report.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [preset, customFrom, customTo]);

  if (loading) return <DashboardLayout><div className="p-6">Loading...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-6 text-red-600">{error}</div></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="p-6">No data available.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Customer Report</h1>
          <DateRangeSelector
            preset={preset}
            onPresetChange={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Customers</p>
            <h2 className="text-2xl font-bold">{data.customerCount}</h2>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Top Customers</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.topCustomers.map((row) => (
                <tr key={row.clientId}>
                  <td className="px-6 py-4 text-sm">{row.customerName}</td>
                  <td className="px-6 py-4 text-sm text-right">${row.totalSales.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">${row.paid.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">${row.outstanding.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">{row.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Payment History</h2>
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
              {data.paymentHistory.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-sm">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">{p.customerName}</td>
                  <td className="px-6 py-4 text-sm">{p.invoiceNumber || "-"}</td>
                  <td className="px-6 py-4 text-sm text-right">${p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CustomerReportPage;
