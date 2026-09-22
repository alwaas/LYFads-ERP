import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";

import DateRangeSelector from "../../components/reports/DateRangeSelector";

import KpiCards from "../../components/reports/KpiCards";
import SalesTrendChart from "../../components/reports/SalesTrendChart";
import ReceivablesAgingChart from "../../components/reports/ReceivablesAgingChart";
import TopCustomersTable from "../../components/reports/TopCustomersTable";
import TopOutstandingTable from "../../components/reports/TopOutstandingTable";
import RecentActivityTable from "../../components/reports/RecentActivityTable";

import {
  getDashboardReport,
  getSalesReport,
  getReceivablesReport,
  getCustomerReport,
} from "../../services/report.service";

import type { DashboardReport, SalesReport, ReceivablesReport, CustomerReport } from "../../types/report";

type DatePreset = "today" | "week" | "month" | "lastMonth" | "quarter" | "year" | "custom";

function getDateRange(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { dateFrom: today.toISOString().slice(0, 10), dateTo: today.toISOString().slice(0, 10) };
    case "week": {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return { dateFrom: start.toISOString().slice(0, 10), dateTo: today.toISOString().slice(0, 10) };
    }
    case "month":
      return { dateFrom: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10), dateTo: today.toISOString().slice(0, 10) };
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { dateFrom: start.toISOString().slice(0, 10), dateTo: end.toISOString().slice(0, 10) };
    }
    case "quarter": {
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), quarter * 3, 1);
      return { dateFrom: start.toISOString().slice(0, 10), dateTo: today.toISOString().slice(0, 10) };
    }
    case "year":
      return { dateFrom: new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10), dateTo: today.toISOString().slice(0, 10) };
    default:
      return {};
  }
}

function ReportsDashboardPage() {
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dashboard, setDashboard] = useState<DashboardReport | null>(null);
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [receivables, setReceivables] = useState<ReceivablesReport | null>(null);
  const [customers, setCustomers] = useState<CustomerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const range = preset === "custom" ? { dateFrom: customFrom, dateTo: customTo } : getDateRange(preset);

      const [dash, salesData, recv, cust] = await Promise.all([
        getDashboardReport(range),
        getSalesReport(range),
        getReceivablesReport(),
        getCustomerReport(range),
      ]);

      setDashboard(dash);
      setSales(salesData);
      setReceivables(recv);
      setCustomers(cust);
    } catch (err) {
      setError("Failed to load reports. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <DateRangeSelector
            preset={preset}
            onPresetChange={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Financial & Operational Reports</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/reports/sales" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Sales</h3>
              <p className="text-xs text-slate-500 mt-0.5">Invoices & revenue</p>
            </Link>
            <Link to="/reports/receivables" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Receivables</h3>
              <p className="text-xs text-slate-500 mt-0.5">AR & aging schedule</p>
            </Link>
            <Link to="/reports/payables" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Payables</h3>
              <p className="text-xs text-slate-500 mt-0.5">AP & vendor aging</p>
            </Link>
            <Link to="/reports/profitability" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Profitability</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gross margins & COGS</p>
            </Link>
            <Link to="/reports/expenses" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Expenses</h3>
              <p className="text-xs text-slate-500 mt-0.5">Operating breakdown</p>
            </Link>
            <Link to="/reports/purchases" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Purchases</h3>
              <p className="text-xs text-slate-500 mt-0.5">Procurement spend</p>
            </Link>
            <Link to="/reports/vendors" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Vendors</h3>
              <p className="text-xs text-slate-500 mt-0.5">Supplier directory</p>
            </Link>
            <Link to="/reports/customers" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
              <h3 className="font-semibold text-slate-900 text-sm">Customers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Client performance</p>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Workforce & Payroll Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/reports/employees" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-slate-900">Employee Directory</h3>
              <p className="text-sm text-slate-500">View all employee records</p>
            </Link>
            <Link to="/reports/attendance-summary" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-slate-900">Attendance Summary</h3>
              <p className="text-sm text-slate-500">Monthly attendance overview</p>
            </Link>
            <Link to="/reports/leave-report" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-slate-900">Leave Report</h3>
              <p className="text-sm text-slate-500">Leave analytics and trends</p>
            </Link>
            <Link to="/reports/payroll-summary" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-slate-900">Payroll Summary</h3>
              <p className="text-sm text-slate-500">Payroll overview by status</p>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading reports...</div>
        ) : dashboard ? (
          <>
            <KpiCards data={dashboard} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SalesTrendChart data={sales?.salesByMonth || []} />
              <ReceivablesAgingChart data={receivables?.aging || { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TopCustomersTable customers={customers?.topCustomers || []} />
              <TopOutstandingTable customers={receivables?.topOutstandingCustomers || []} />
            </div>

            <RecentActivityTable payments={customers?.paymentHistory || []} />
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">No data available.</div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ReportsDashboardPage;
