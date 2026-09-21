import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DateRangeSelector from "../../components/reports/DateRangeSelector";
import ExportButton from "../../components/reports/ExportButton";
import { getVendorReport } from "../../services/report.service";
import type { VendorReport } from "../../types/report";

type Preset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function VendorReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<VendorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined;
      const result = await getVendorReport(params);
      setData(result);
    } catch (err) {
      setError("Failed to load vendor report.");
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
        <div className="p-6 text-gray-500">Loading vendor report...</div>
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

  const totalSpend = data.vendors.reduce((sum, v) => sum + (v.totalPurchases || 0), 0);
  const totalInvoices = data.vendors.reduce((sum, v) => sum + (v.purchaseCount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Report</h1>
            <p className="text-sm text-gray-500 mt-1">Directory and performance summary of suppliers and vendors</p>
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
            <ExportButton reportType="vendors" params={preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : undefined} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Vendors</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.totalVendors}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Active Vendors</p>
            <h2 className="text-2xl font-bold text-emerald-600 mt-1">{data.activeVendors}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Invoices</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{totalInvoices}</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Spend</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Vendor Directory & Procurement Performance</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email / Phone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bills</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No vendor records found.
                  </td>
                </tr>
              ) : (
                data.vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.contactPerson || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{v.email || "—"}</div>
                      {v.phone && <div className="text-xs text-gray-400">{v.phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {v.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">{v.purchaseCount}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      ${(v.totalPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default VendorReportPage;
