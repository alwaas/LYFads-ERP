import { useState, useEffect } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import DateRangeSelector from "../../components/reports/DateRangeSelector";
import ExportButton from "../../components/reports/ExportButton";

import {
  getSalesReport,
} from "../../services/report.service";

import type { SalesReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function SalesReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined;
      const result = await getSalesReport(params);
      setData(result);
    } catch (err) {
      setError("Failed to load sales report.");
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
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <div className="flex items-center gap-2">
            <DateRangeSelector
              preset={preset}
              onPresetChange={setPreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />
            <ExportButton reportType="sales" params={preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Sales</p>
            <h2 className="text-2xl font-bold">${data.totalSales.toLocaleString()}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Invoices</p>
            <h2 className="text-2xl font-bold">{data.invoiceCount}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Paid</p>
            <h2 className="text-2xl font-bold">${data.paidAmount.toLocaleString()}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Outstanding</p>
            <h2 className="text-2xl font-bold">${data.outstandingAmount.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Sales by Customer</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.salesByCustomer.map((row) => (
                <tr key={row.clientId}>
                  <td className="px-6 py-4 text-sm">{row.customerName}</td>
                  <td className="px-6 py-4 text-sm text-right">${row.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">${row.paid.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">${row.outstanding.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SalesReportPage;
