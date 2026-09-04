import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Receipt,
  FileText,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import Pagination from "../../components/ui/Pagination";
import { vendorBillService } from "../../services/vendor-bill.service";
import type { VendorBillStatus } from "../../types/vendor-bill";

type PagedResponse = {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  APPROVED: "bg-amber-100 text-amber-800",
  POSTED: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  VOIDED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-800",
};

const VendorBillsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: result, isLoading, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ["vendor-bills", page, limit, searchQuery, statusFilter],
    queryFn: () => vendorBillService.getAllVendorBills(page, limit, searchQuery, statusFilter),
  });

  const vendorBills = result?.data || [];
  const totalPages = result?.totalPages || 1;

  const approveMutation = useMutation({
    mutationFn: (id: string) => vendorBillService.approveVendorBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      toast.success("Vendor bill approved");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed to approve"),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => vendorBillService.postVendorBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      toast.success("Vendor bill posted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed to post"),
  });

  const voidMutation = useMutation({
    mutationFn: (id: string) => vendorBillService.voidVendorBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      toast.success("Vendor bill voided");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed to void"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => vendorBillService.cancelVendorBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      toast.success("Vendor bill cancelled");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed to cancel"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorBillService.deleteVendorBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      toast.success("Vendor bill deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed to delete"),
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this vendor bill? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load vendor bills</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Bills</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Manage purchase invoices and payables</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <a
            href="/vendor-bills/add"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Vendor Bill
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor bills..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="POSTED">Posted</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="VOIDED">Voided</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendorBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No vendor bills found
                  </td>
                </tr>
              ) : (
                vendorBills.map((bill: any) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{bill.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{bill.vendor?.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(bill.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[bill.status as VendorBillStatus] || "bg-gray-100 text-gray-800"}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ${Number(bill.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${Number(bill.balanceAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={`/vendor-bills/${bill.id}`}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {bill.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(bill.id)}
                              disabled={approveMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => postMutation.mutate(bill.id)}
                              disabled={postMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                              title="Post"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <a
                              href={`/vendor-bills/${bill.id}/edit`}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDelete(bill.id)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {bill.status === "APPROVED" && (
                          <button
                            onClick={() => postMutation.mutate(bill.id)}
                            disabled={postMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                            title="Post"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {(bill.status === "APPROVED" || bill.status === "POSTED") && (
                          <button
                            onClick={() => voidMutation.mutate(bill.id)}
                            disabled={voidMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                            title="Void"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {["APPROVED", "POSTED", "PARTIALLY_PAID"].includes(bill.status as string) && (
                          <button
                            onClick={() => cancelMutation.mutate(bill.id)}
                            disabled={cancelMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                            title="Cancel"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {bill.status === "DRAFT" && (
                          <a
                            href={`/vendor-bills/${bill.id}/apply-payment`}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                            title="Record Payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default VendorBillsPage;
