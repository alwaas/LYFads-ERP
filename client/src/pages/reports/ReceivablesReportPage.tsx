import { useState, useEffect } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import DateRangeSelector from "../../components/reports/DateRangeSelector";

import {
  getReceivablesReport,
} from "../../services/report.service";

import type { ReceivablesReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function ReceivablesReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [receivables, setReceivables] = useState<ReceivablesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const recv = await getReceivablesReport();
      setReceivables(recv);
    } catch (err) {
      setError("Failed to load receivables report.");
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
  if (!receivables) return <DashboardLayout><div className="p-6">No data available.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Receivables Report</h1>
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
            <p className="text-sm text-gray-500">Total Receivables</p>
            <h2 className="text-2xl font-bold">${receivables.totalReceivables.toLocaleString()}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Current</p>
            <h2 className="text-2xl font-bold">${receivables.currentReceivables.toLocaleString()}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Overdue</p>
            <h2 className="text-2xl font-bold text-red-600">${receivables.overdueReceivables.toLocaleString()}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Paid</p>
            <h2 className="text-2xl font-bold text-green-600">${receivables.paid.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Aging Summary</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(receivables.aging).map(([period, amount]) => (
                <tr key={period}>
                  <td className="px-6 py-4 text-sm">{period} days</td>
                  <td className="px-6 py-4 text-sm text-right">${amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
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
              {receivables.topOutstandingCustomers.map((row) => (
                <tr key={row.clientId}>
                  <td className="px-6 py-4 text-sm">{row.customerName}</td>
                  <td className="px-6 py-4 text-sm text-right text-red-600">${row.outstanding.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">{row.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ReceivablesReportPage;
