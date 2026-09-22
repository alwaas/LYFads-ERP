import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Search, Trash2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../../components/common/PageLoader";
import Pagination from "../../../components/ui/Pagination";
import { paymentService } from "../../../services/payment.service";
import type { PaymentAllocation } from "../../../types/payment";

type PagedResponse = {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const PaymentAllocationsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: result, isLoading, isError } = useQuery<PagedResponse>({
    queryKey: ["payment-allocations", page, limit, searchQuery],
    queryFn: () => paymentService.getAllPaymentAllocations(page, limit, searchQuery),
  });

  const allocations = result?.data || [];
  const totalPages = result?.totalPages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentService.deletePaymentAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Allocation removed successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to remove allocation";
      toast.error(message);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this allocation?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load payment allocations</h2>
        <p className="mt-1 text-sm text-red-600">The payment allocations service could not be loaded.</p>
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
              Payment Allocations
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage payment allocations across invoices
          </p>
        </div>

        <a
          href="/payments"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search allocations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No payment allocations found
                  </td>
                </tr>
              ) : (
                allocations.map((alloc: PaymentAllocation) => (
                  <tr key={alloc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">
                      {alloc.payment?.referenceNo || `Payment ${alloc.paymentId.slice(-6)}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {alloc.invoice?.invoiceNumber || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {alloc.invoice?.client?.companyName || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ${Number(alloc.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(alloc.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                        title="Remove Allocation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit: number) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentAllocationsPage;
