import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import PayrollTable from "../../components/payroll/PayrollTable";
import Pagination from "../../components/ui/Pagination";

import {
  getPayrolls,
  deletePayroll,
  processPayroll,
  approvePayroll,
  markPayrollPaid,
} from "../../services/payroll.service";
import type { Payroll, PaymentMethod } from "../../types/payroll";

function PayrollPage() {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      const result: any = await getPayrolls(page, limit, search);
      setPayrolls(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payroll records.");
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrolls();
  }, [page, limit]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      const result: any = await getPayrolls(page, limit, search);
      setPayrolls(result.data || []);
      setTotalPages(result.totalPages || 1);
      toast.success("Payroll refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payroll record?")) return;
    try {
      await deletePayroll(id);
      setPayrolls((prev) => prev.filter((x) => x.id !== id));
      toast.success("Payroll record deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleProcess = async (id: string) => {
    try {
      await processPayroll(id);
      toast.success("Payroll processed.");
      loadPayrolls();
    } catch (error) {
      console.error(error);
      toast.error("Process failed.");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePayroll(id);
      toast.success("Payroll approved.");
      loadPayrolls();
    } catch (error) {
      console.error(error);
      toast.error("Approve failed.");
    }
  };

  const handleMarkPaid = async (id: string) => {
    const method = window.prompt("Enter payment method (CASH, BANK_TRANSFER, UPI, CARD, CHEQUE):");
    if (!method) return;
    const reference = window.prompt("Enter payment reference (optional):");
    try {
      await markPayrollPaid(id, method as PaymentMethod, reference || undefined);
      toast.success("Payroll marked as paid.");
      loadPayrolls();
    } catch (error) {
      console.error(error);
      toast.error("Mark paid failed.");
    }
  };

  const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
  const filteredPayrolls = safePayrolls.filter((payroll: any) => {
    const keyword = search.toLowerCase();
    const employeeName = payroll.employee?.user?.fullName?.toLowerCase() || "";
    const employeeCode = payroll.employee?.employeeCode?.toLowerCase() || "";
    return (
      employeeName.includes(keyword) ||
      employeeCode.includes(keyword) ||
      payroll.status?.toLowerCase().includes(keyword)
    );
  });

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading payroll...</p>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Payroll
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage employee payroll and salary disbursement
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate("/payroll/add")}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Payroll
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payroll..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredPayrolls.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500">No payroll records found.</p>
              </div>
            ) : (
              <PayrollTable
                payrolls={filteredPayrolls}
                onView={(id) => navigate(`/payroll/view/${id}`)}
                onEdit={(id) => navigate(`/payroll/edit/${id}`)}
                onDelete={handleDelete}
                onProcess={handleProcess}
                onApprove={handleApprove}
                onMarkPaid={handleMarkPaid}
              />
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default PayrollPage;
