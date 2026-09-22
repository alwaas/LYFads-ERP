import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DateRangeSelector from "../../components/reports/DateRangeSelector";
import ExportButton from "../../components/reports/ExportButton";
import { getExpenseReport } from "../../services/report.service";
import type { ExpenseReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function ExpenseReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined;
      const result = await getExpenseReport(params);
      setData(result);
    } catch (err) {
      setError("Failed to load expense report.");
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
        <div className="p-6 text-gray-500">Loading expense report...</div>
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

  const topCategory = data.byCategory.length > 0 ? data.byCategory[0] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Report</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of company operating expenses and category breakdown</p>
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
            <ExportButton reportType="expenses" params={preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Expense Entries</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.expenseCount}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Top Category</p>
            <h2 className="text-2xl font-bold text-indigo-600 mt-1">{topCategory?.category || "N/A"}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Top Category Spend</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${(topCategory?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Expenses by Category Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Expenses by Category</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Share of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.byCategory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    No expense category records found for this period.
                  </td>
                </tr>
              ) : (
                data.byCategory.map((cat) => {
                  const share = data.totalExpenses > 0 ? ((cat.total / data.totalExpenses) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={cat.category} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.category}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">{share}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expenses by Month Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Monthly Expense Trend</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.byMonth.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                    No monthly expense data recorded.
                  </td>
                </tr>
              ) : (
                data.byMonth.map((m) => (
                  <tr key={m.month} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.month}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">${m.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

export default ExpenseReportPage;
