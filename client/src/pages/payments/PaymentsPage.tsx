import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { paymentService } from "../../services/payment.service";
import type { Payment, PaymentMethod } from "../../types/payment";

const methodColors: Record<PaymentMethod, string> = {
  CASH: "bg-green-100 text-green-800",
  BANK_TRANSFER: "bg-blue-100 text-blue-800",
  UPI: "bg-purple-100 text-purple-800",
  CARD: "bg-orange-100 text-orange-800",
  CHEQUE: "bg-gray-100 text-gray-800",
};

const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const { data: payments = [], isLoading, isError } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: () => paymentService.getAllPayments(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentService.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete payment");
    },
  });

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice?.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice?.client?.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load payments</h2>
        <p className="mt-1 text-sm text-red-600">The payments service could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payments
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage all payment records and transactions
          </p>
        </div>

        <a
          href="/payments/add"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Payment
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Payments
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {payments.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
              <CreditCard className="h-5 w-5 text-blue-600" />
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
                ${payments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                This Month
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {payments.filter(p => {
                  const paymentDate = new Date(p.paymentDate);
                  const now = new Date();
                  return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50">
              <CreditCard className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Unique Clients
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {new Set(payments.map(p => p.invoice?.client?.companyName).filter(Boolean)).size}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50">
              <CreditCard className="h-5 w-5 text-amber-600" />
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
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reference
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {payment.invoice?.invoiceNumber || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {payment.invoice?.client?.companyName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      ${Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${methodColors[payment.method]}`}>
                        {payment.method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {payment.referenceNo || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/payments/${payment.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={`/payments/edit/${payment.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(payment.id)}
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

export default PaymentsPage;