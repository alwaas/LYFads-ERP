import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DateRangeSelector from "../../components/reports/DateRangeSelector";
import ExportButton from "../../components/reports/ExportButton";
import { getProfitabilityReport } from "../../services/report.service";
import type { ProfitabilityReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function ProfitabilityReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<ProfitabilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined;
      const result = await getProfitabilityReport(params);
      setData(result);
    } catch (err) {
      setError("Failed to load profitability report.");
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
        <div className="p-6 text-gray-500">Loading profitability report...</div>
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

  const revenue = data.totalRevenue || 0;
  const cogs = data.totalCogs || 0;
  const grossProfit = data.grossProfit || (revenue - cogs);
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0.0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Profitability Report</h1>
              {data.method && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Valuation: {data.method}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Gross profit margin, revenue performance, and Cost of Goods Sold analysis</p>
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
            <ExportButton reportType="profitability" params={preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Cost of Goods Sold (COGS)</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Gross Profit</p>
            <h2 className={`text-2xl font-bold mt-1 ${grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Gross Margin</p>
            <h2 className={`text-2xl font-bold mt-1 ${Number(grossMargin) >= 20 ? "text-emerald-600" : Number(grossMargin) >= 0 ? "text-amber-600" : "text-red-600"}`}>
              {grossMargin}%
            </h2>
          </div>
        </div>

        {/* COGS Breakdown by Product Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Cost of Goods Sold by Product</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">COGS Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Share of COGS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!data.cogsByProduct || data.cogsByProduct.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    No product COGS records for this period.
                  </td>
                </tr>
              ) : (
                data.cogsByProduct.map((p) => {
                  const share = cogs > 0 ? ((p.totalCogs / cogs) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={p.productId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">{p.productId}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">${p.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">{share}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProfitabilityReportPage;
