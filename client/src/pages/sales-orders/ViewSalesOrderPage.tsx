import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { PackagePlus, ArrowLeft, Edit, Trash2, Layers, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { salesOrderService } from "../../services/sales-order.service";
import type { SalesOrder, SalesOrderStatus } from "../../types/sales-order";

const statusColors: Record<SalesOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  FULFILLED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ViewSalesOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [confirmingFulfill, setConfirmingFulfill] = useState(false);

  const { data: salesOrder, isLoading, isError } = useQuery<SalesOrder>({
    queryKey: ["sales-order", id],
    queryFn: () => salesOrderService.getSalesOrderById(id!),
    enabled: !!id,
  });

  const fulfillWithInventoryMutation = useMutation({
    mutationFn: () => salesOrderService.fulfillWithInventory(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      if (data?.alreadyFulfilled) {
        toast.success("Order already fulfilled with inventory");
      } else {
        toast.success(`Fulfilled with ${data.movements} stock movement(s)`);
      }
      setConfirmingFulfill(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fulfill with inventory",
      );
      setConfirmingFulfill(false);
    },
  });

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this sales order?")) {
      try {
        await salesOrderService.deleteSalesOrder(id);
        toast.success("Sales order deleted successfully");
        navigate("/sales-orders");
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || "Failed to delete sales order";
        toast.error(message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading sales order...</div>
      </div>
    );
  }

  if (isError || !salesOrder) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Sales order not found</h2>
        <p className="mt-1 text-sm text-red-600">The sales order could not be loaded.</p>
      </div>
    );
  }

  const canFulfillWithInventory =
    salesOrder.status === "DRAFT" ||
    salesOrder.status === "CONFIRMED" ||
    salesOrder.status === "PROCESSING";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/sales-orders")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {salesOrder.orderNumber}
            </h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[salesOrder.status]}`}
            >
              {salesOrder.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Sales Order Details</p>
        </div>
        <div className="flex items-center gap-2">
          {canFulfillWithInventory && (
            <button
              onClick={() => setConfirmingFulfill(true)}
              disabled={fulfillWithInventoryMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
            >
              <Layers className="h-4 w-4" />
              Fulfill with inventory
            </button>
          )}
          <a
            href={`/sales-orders/${salesOrder.id}/edit`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </a>
          {(salesOrder.status === "DRAFT" || salesOrder.status === "CONFIRMED" || salesOrder.status === "PROCESSING") && (
            <button
              onClick={handleDelete}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {confirmingFulfill && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Fulfill with inventory?
            </p>
            <p className="text-xs text-amber-700 mt-1">
              This will deduct stock from your warehouse and mark the order as
              FULFILLED. This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmingFulfill(false)}
              className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
            >
              Cancel
            </button>
            <button
              onClick={() => fulfillWithInventoryMutation.mutate()}
              disabled={fulfillWithInventoryMutation.isPending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {fulfillWithInventoryMutation.isPending ? "Fulfilling..." : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {salesOrder.status === "CANCELLED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">
            This order is cancelled and cannot be fulfilled.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Order Number</p>
              <p className="mt-1 text-sm text-slate-900">{salesOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Status</p>
              <p className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[salesOrder.status]}`}>
                  {salesOrder.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Order Date</p>
              <p className="mt-1 text-sm text-slate-900">{new Date(salesOrder.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Expected Delivery Date</p>
              <p className="mt-1 text-sm text-slate-900">
                {salesOrder.expectedDeliveryDate ? new Date(salesOrder.expectedDeliveryDate).toLocaleDateString() : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Subtotal</p>
              <p className="mt-1 text-sm text-slate-900">${Number(salesOrder.subtotal).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Discount</p>
              <p className="mt-1 text-sm text-slate-900">${Number(salesOrder.discount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tax</p>
              <p className="mt-1 text-sm text-slate-900">${Number(salesOrder.tax).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">${Number(salesOrder.total).toFixed(2)}</p>
            </div>
            {salesOrder.notes && (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-slate-500">Notes</p>
                <p className="mt-1 text-sm text-slate-900">{salesOrder.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Client</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Company Name</p>
              <p className="mt-1 text-sm text-slate-900">{salesOrder.client?.companyName || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Contact Person</p>
              <p className="mt-1 text-sm text-slate-900">{salesOrder.client?.contactPerson || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="mt-1 text-sm text-slate-900">{salesOrder.client?.email || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Quantity</th>
                <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                <th className="px-4 py-3 font-medium text-right">Discount</th>
                <th className="px-4 py-3 font-medium text-right">Tax</th>
                <th className="px-4 py-3 font-medium text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrder.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                    No items in this order
                  </td>
                </tr>
              ) : (
                salesOrder.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{item.product?.name || "-"}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{Number(item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${Number(item.discount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${Number(item.tax).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">${Number(item.lineTotal).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => navigate("/sales-orders")}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Back to Sales Orders
        </button>
        <a
          href={`/sales-orders/${salesOrder.id}/edit`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Edit className="h-4 w-4" />
          Edit Sales Order
        </a>
      </div>
    </div>
  );
};

export default ViewSalesOrderPage;
