import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DateRangeSelector from "../../components/reports/DateRangeSelector";
import ExportButton from "../../components/reports/ExportButton";
import { getPayablesReport } from "../../services/report.service";
import type { PayablesReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function PayablesReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<PayablesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined;
      const result = await getPayablesReport(params);
      setData(result);
    } catch (err) {
      setError("Failed to load payables report.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [preset, customFrom, customTo]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-500">Loading payables report...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-red-600">{error}</div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-500">No data available.</div>
      </DashboardLayout>
    );
  }

  const overdueAmount = (data.aging.days31to60 || 0) + (data.aging.days61to90 || 0) + (data.aging.days90plus || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Accounts Payable Report</h1>
            <p className="text-sm text-gray-500 mt-1">Vendor liabilities, aging schedules, and outstanding bills</p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeSelector
              preset={preset}
              onPresetChange={setPreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />
            <ExportButton reportType="payables" params={preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Payables</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${data.totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Current (0-30 Days)</p>
            <h2 className="text-2xl font-bold text-emerald-600 mt-1">${(data.aging.current || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Overdue (&gt; 30 Days)</p>
            <h2 className="text-2xl font-bold text-red-600 mt-1">${overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Outstanding Bills</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.billCount}</h2>
          </div>
        </div>

        {/* Aging Summary Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Aging Schedule</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aging Bucket</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Share of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { label: "Current (0-30 days)", value: data.aging.current || 0 },
                { label: "31 - 60 days", value: data.aging.days31to60 || 0 },
                { label: "61 - 90 days", value: data.aging.days61to90 || 0 },
                { label: "90+ days overdue", value: data.aging.days90plus || 0 },
              ].map((bucket) => {
                const share = data.totalPayables > 0 ? ((bucket.value / data.totalPayables) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={bucket.label} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{bucket.label}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">${bucket.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">{share}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Top Outstanding Bills Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Top Outstanding Vendor Bills</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill / Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!data.topOutstandingVendors || data.topOutstandingVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No outstanding vendor bills.
                  </td>
                </tr>
              ) : (
                data.topOutstandingVendors.map((v) => (
                  <tr key={v.purchaseInvoiceId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.vendorName}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{v.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(v.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          v.daysOverdue > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {v.daysOverdue > 0 ? `${v.daysOverdue} days` : "Current"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      ${v.balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PayablesReportPage;
