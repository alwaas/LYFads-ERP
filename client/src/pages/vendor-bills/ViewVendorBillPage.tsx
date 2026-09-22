import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Receipt,
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  CreditCard,
  Calendar,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { vendorBillService } from "../../services/vendor-bill.service";
import type { VendorBill, VendorBillStatus } from "../../types/vendor-bill";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  APPROVED: "bg-amber-100 text-amber-800",
  POSTED: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  VOIDED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-800",
};

const ViewVendorBillPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const { data: bill, isLoading } = useQuery<VendorBill>({
    queryKey: ["vendor-bill", id],
    queryFn: () => vendorBillService.getVendorBillById(id!),
    enabled: !!id,
  });

  const refresh = (label: string) => {
    queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
    toast.success(`Vendor bill ${label}`);
  };

  const approveMutation = useMutation({
    mutationFn: () => vendorBillService.approveVendorBill(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["vendor-bill", id], updated);
      refresh("approved");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Failed to approve"),
  });

  const postMutation = useMutation({
    mutationFn: () => vendorBillService.postVendorBill(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["vendor-bill", id], updated);
      refresh("posted");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Failed to post"),
  });

  const voidMutation = useMutation({
    mutationFn: () => vendorBillService.voidVendorBill(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["vendor-bill", id], updated);
      refresh("voided");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Failed to void"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => vendorBillService.cancelVendorBill(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["vendor-bill", id], updated);
      refresh("cancelled");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Failed to cancel"),
  });

  if (isLoading) return <PageLoader />;

  if (!bill) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Vendor bill not found</h2>
      </div>
    );
  }

  const st = bill.status as VendorBillStatus;
  const canEdit = st === "DRAFT";
  const canApprove = st === "DRAFT";
  const canPost = st === "APPROVED";
  const canVoid = st === "APPROVED" || st === "POSTED";
  const canCancel = st === "APPROVED" || st === "POSTED";
  const canPay = st === "POSTED" || st === "PARTIALLY_PAID";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/vendor-bills")} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Bill {bill.invoiceNumber}</h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[st] || "bg-gray-100 text-gray-800"}`}
            >
              {bill.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Vendor: {bill.vendor?.name || "-"}</p>
        </div>
        {canEdit && (
          <a
            href={`/vendor-bills/${bill.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> Edit
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Bill Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Number</label>
                <p className="text-sm text-slate-900">{bill.invoiceNumber}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Vendor</label>
                <p className="text-sm text-slate-900">{bill.vendor?.name || "-"}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">PO Reference</label>
                <p className="text-sm text-slate-900">{bill.purchaseOrder?.orderNumber || bill.purchaseOrderId || "-"}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Issue Date</label>
                <p className="text-sm text-slate-900 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {bill.issueDate ? new Date(bill.issueDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                <p className="text-sm text-slate-900 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
            {bill.notes && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{bill.notes}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
                    <th className="px-4 py-3 font-medium text-right">Discount</th>
                    <th className="px-4 py-3 font-medium text-right">Tax</th>
                    <th className="px-4 py-3 font-medium text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(bill.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-3 text-slate-900">{it.description}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{Number(it.quantity).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">${Number(it.unitCost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">${Number(it.discount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">${Number(it.tax).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">${Number(it.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="text-slate-900">${Number(bill.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-slate-900">${Number(bill.discount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="text-slate-900">${Number(bill.tax).toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span className="text-slate-500">Total</span><span className="text-slate-900">${Number(bill.total).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="text-slate-900">${Number(bill.amountPaid).toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span className="text-slate-500">Balance</span><span className="text-slate-900">${Number(bill.balanceAmount).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
            <div className="flex flex-col gap-2">
              {canApprove && (
                <button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
              )}
              {canPost && (
                <button
                  onClick={() => postMutation.mutate()}
                  disabled={postMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" /> Post
                </button>
              )}
              {canPay && (
                <a
                  href={`/vendor-bills/${bill.id}/apply-payment`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <CreditCard className="h-4 w-4" /> Record Payment
                </a>
              )}
              {canVoid && (
                <button
                  onClick={() => voidMutation.mutate()}
                  disabled={voidMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Void
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewVendorBillPage;
