import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DateRangeSelector from "../../components/reports/DateRangeSelector";
import ExportButton from "../../components/reports/ExportButton";
import { getPurchaseReport } from "../../services/report.service";
import type { PurchaseReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function PurchaseReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<PurchaseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined;
      const result = await getPurchaseReport(params);
      setData(result);
    } catch (err) {
      setError("Failed to load purchase report.");
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
        <div className="p-6 text-gray-500">Loading purchase report...</div>
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

  const topVendor = data.byVendor.length > 0 ? data.byVendor[0] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Report</h1>
            <p className="text-sm text-gray-500 mt-1">Summary of procurement spend and vendor allocations</p>
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
            <ExportButton reportType="purchases" params={preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Procurement</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${data.totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Purchase Invoices</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.purchaseCount}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Top Supplier</p>
            <h2 className="text-2xl font-bold text-indigo-600 mt-1">{topVendor?.vendorName || "N/A"}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Top Supplier Spend</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${(topVendor?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Purchases by Vendor Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Purchases by Vendor</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spend</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Share of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.byVendor.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    No vendor purchase data recorded for this period.
                  </td>
                </tr>
              ) : (
                data.byVendor.map((v) => {
                  const share = data.totalPurchases > 0 ? ((v.total / data.totalPurchases) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={v.vendorId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.vendorName}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">${v.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">{share}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Monthly Trend Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Monthly Purchase Trend</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.byMonth.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                    No monthly purchase trend recorded.
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

export default PurchaseReportPage;
