import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Search, RefreshCw, Edit, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { invoiceService } from "../../services/invoice.service";
import type { Invoice, InvoiceStatus } from "../../types/invoice";

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const InvoicesPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices = [], isLoading, isError, refetch } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoices(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to delete invoice";
      toast.error(message);
    },
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client?.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.project?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load invoices</h2>
        <p className="mt-1 text-sm text-red-600">The invoices service could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Invoices
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage all invoices and billing records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <a
            href="/invoices/add"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Invoice
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Invoices
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {invoices.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Amount
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${invoices.reduce((sum, inv) => sum + Number(inv.total), 0).toFixed(2)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Paid Amount
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0).toFixed(2)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Outstanding Balance
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0).toFixed(2)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invoice Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {invoice.client?.companyName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {invoice.project?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      ${Number(invoice.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      ${Number(invoice.paidAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      ${Number(invoice.balanceAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status as InvoiceStatus] || "bg-gray-100 text-gray-800"}`}>
                        {invoice.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/invoices/${invoice.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={`/invoices/edit/${invoice.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
