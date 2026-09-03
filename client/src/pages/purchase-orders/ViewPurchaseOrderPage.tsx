import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Edit, Truck, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { purchaseOrderService } from "../../services/purchase-order.service";
import type { PurchaseOrder, PurchaseOrderStatus } from "../../types/purchase-order";

const statusColors: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-amber-100 text-amber-800",
  RECEIVED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ViewPurchaseOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const { data: po, isLoading, isError } = useQuery<PurchaseOrder>({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrderService.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => purchaseOrderService.submitPurchaseOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Submitted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed"),
  });

  const approveMutation = useMutation({
    mutationFn: () => purchaseOrderService.approvePurchaseOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Approved");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrderService.cancelPurchaseOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Cancelled");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => purchaseOrderService.deletePurchaseOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Deleted");
      navigate("/purchase-orders");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed"),
  });

  if (isLoading) {
    return <div className="text-slate-500 text-center py-8">Loading purchase order...</div>;
  }

  if (isError || !po) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Purchase order not found</h2>
      </div>
    );
  }

  const canSubmit = po.status === "DRAFT";
  const canApprove = po.status === "SUBMITTED";
  const canReceive = po.status === "SUBMITTED" || po.status === "APPROVED";
  const canCancel = po.status === "DRAFT" || po.status === "SUBMITTED";
  const canEdit = po.status === "DRAFT";
  const canDelete = po.status === "DRAFT" || po.status === "CANCELLED";

  const handleDelete = () => {
    if (window.confirm("Delete this purchase order?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/purchase-orders")} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{po.orderNumber}</h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[po.status]}`}
            >
              {po.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Purchase Order Details</p>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Submit
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
          )}
          {canReceive && (
            <a
              href={`/purchase-orders/${po.id}/receive`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              <Truck className="h-4 w-4" /> Receive
            </a>
          )}
          {canCancel && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          )}
          {canEdit && (
            <a
              href={`/purchase-orders/${po.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Edit className="h-4 w-4" /> Edit
            </a>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Order Number</p>
              <p className="mt-1 text-sm text-slate-900">{po.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Status</p>
              <p className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[po.status]}`}>
                  {po.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Order Date</p>
              <p className="mt-1 text-sm text-slate-900">{new Date(po.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Expected Delivery</p>
              <p className="mt-1 text-sm text-slate-900">
                {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Subtotal</p>
              <p className="mt-1 text-sm text-slate-900">${Number(po.subtotal).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Discount</p>
              <p className="mt-1 text-sm text-slate-900">${Number(po.discount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tax</p>
              <p className="mt-1 text-sm text-slate-900">${Number(po.tax).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">${Number(po.total).toFixed(2)}</p>
            </div>
            {po.notes && (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-slate-500">Notes</p>
                <p className="mt-1 text-sm text-slate-900">{po.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Vendor</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Name</p>
              <p className="mt-1 text-sm text-slate-900">{po.vendor?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Contact</p>
              <p className="mt-1 text-sm text-slate-900">{po.vendor?.contactPerson || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="mt-1 text-sm text-slate-900">{po.vendor?.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Warehouse</p>
              <p className="mt-1 text-sm text-slate-900">{po.warehouse?.name || "Default"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
                <th className="px-4 py-3 font-medium text-right">Discount</th>
                <th className="px-4 py-3 font-medium text-right">Tax</th>
                <th className="px-4 py-3 font-medium text-right">Received</th>
                <th className="px-4 py-3 font-medium text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-slate-500">No items</td>
                </tr>
              ) : (
                po.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-3 text-slate-900">{it.product?.name || it.productId}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{Number(it.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${Number(it.unitCost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${Number(it.discount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${Number(it.tax).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{Number(it.receivedQuantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">${Number(it.lineTotal).toFixed(2)}</td>
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

export default ViewPurchaseOrderPage;
