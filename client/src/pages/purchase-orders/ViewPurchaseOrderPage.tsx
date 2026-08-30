import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { purchaseOrderService } from "../../services/purchase-order.service";
import type { PurchaseOrder, PurchaseOrderStatus } from "../../types/purchase-order";

const statusColors: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PARTIALLY_RECEIVED: "bg-orange-100 text-orange-700",
  RECEIVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const ViewPurchaseOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: purchaseOrder, isLoading, isError, refetch } = useQuery<PurchaseOrder>({
    queryKey: ["purchase-orders", id],
    queryFn: () => purchaseOrderService.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  const handleWorkflow = async (action: string) => {
    if (!id || !purchaseOrder) return;

    try {
      switch (action) {
        case "submit":
          await purchaseOrderService.submitPurchaseOrder(id);
          break;
        case "approve":
          await purchaseOrderService.approvePurchaseOrder(id);
          break;
        case "reject":
          await purchaseOrderService.rejectPurchaseOrder(id);
          break;
        case "cancel":
          if (!window.confirm("Are you sure you want to cancel this purchase order?")) return;
          await purchaseOrderService.cancelPurchaseOrder(id);
          break;
        default:
          return;
      }
      toast.success(`Purchase order ${action}ed successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} purchase order`);
    }
  };

  const handleReceive = async () => {
    if (!id || !purchaseOrder) return;

    const items = purchaseOrder.items.map((item) => ({
      itemId: item.id,
      receivedQuantity: Number(item.quantity) - Number(item.receivedQuantity || 0),
    }));

    try {
      await purchaseOrderService.receivePurchaseOrder(id, items);
      toast.success("Purchase order received successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to receive purchase order");
    }
  };

  const handlePartialReceive = async () => {
    if (!id) return;

    const quantities = prompt(
      "Enter received quantities for each item (comma separated):"
    );
    if (!quantities) return;

    const values = quantities.split(",").map((q) => parseFloat(q.trim()));
    if (values.some(isNaN)) {
      toast.error("Invalid quantities");
      return;
    }

    const items = purchaseOrder!.items.map((item, index) => ({
      itemId: item.id,
      receivedQuantity: values[index] || 0,
    }));

    try {
      await purchaseOrderService.receivePurchaseOrder(id, items);
      toast.success("Purchase order received successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to receive purchase order");
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !purchaseOrder) {
    toast.error("Purchase order not found");
    navigate("/purchase-orders");
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/purchase-orders")}
          className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {purchaseOrder.poNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[purchaseOrder.status]}`}>
              {purchaseOrder.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {purchaseOrder.title}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {purchaseOrder.status === "DRAFT" && (
          <>
            <a
              href={`/purchase-orders/edit/${purchaseOrder.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Edit
            </a>
            <button
              onClick={() => handleWorkflow("submit")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Submit
            </button>
            <button
              onClick={() => handleWorkflow("cancel")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
            >
              Cancel
            </button>
          </>
        )}

        {purchaseOrder.status === "SUBMITTED" && (
          <>
            <button
              onClick={() => handleWorkflow("approve")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Approve
            </button>
            <button
              onClick={() => handleWorkflow("reject")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Reject
            </button>
            <button
              onClick={() => handleWorkflow("cancel")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
          </>
        )}

        {(purchaseOrder.status === "APPROVED" || purchaseOrder.status === "PARTIALLY_RECEIVED") && (
          <button
            onClick={handleReceive}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
          >
            Receive All
          </button>
        )}

        {purchaseOrder.status === "PARTIALLY_RECEIVED" && (
          <button
            onClick={handlePartialReceive}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition"
          >
            Receive Partial
          </button>
        )}
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Purchase Order Details</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</p>
              <p className="mt-2 text-sm text-slate-900">{purchaseOrder.vendor.name}</p>
              <p className="text-xs text-slate-500">{purchaseOrder.vendor.vendorCode}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Date</p>
              <p className="mt-2 text-sm text-slate-900">{formatDate(purchaseOrder.orderDate)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Delivery</p>
              <p className="mt-2 text-sm text-slate-900">
                {purchaseOrder.expectedDeliveryDate ? formatDate(purchaseOrder.expectedDeliveryDate) : "-"}
              </p>
            </div>

            {purchaseOrder.createdBy && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created By</p>
                <p className="mt-2 text-sm text-slate-900">{purchaseOrder.createdBy.fullName}</p>
              </div>
            )}

            {purchaseOrder.approvedBy && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved By</p>
                <p className="mt-2 text-sm text-slate-900">{purchaseOrder.approvedBy.fullName}</p>
              </div>
            )}

            {purchaseOrder.approvedAt && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved At</p>
                <p className="mt-2 text-sm text-slate-900">{formatDate(purchaseOrder.approvedAt)}</p>
              </div>
            )}
          </div>

          {purchaseOrder.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{purchaseOrder.description}</p>
            </div>
          )}

          {purchaseOrder.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
              <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{purchaseOrder.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-left">Unit</th>
                <th className="px-6 py-4 text-right">Unit Price</th>
                <th className="px-6 py-4 text-right">Tax Rate</th>
                <th className="px-6 py-4 text-right">Discount</th>
                <th className="px-6 py-4 text-right">Line Total</th>
                <th className="px-6 py-4 text-right">Received</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                purchaseOrder.items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{item.description}</td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4">{item.unit || "-"}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right">{item.taxRate ? `${item.taxRate}%` : "-"}</td>
                    <td className="px-6 py-4 text-right">{item.discount ? formatCurrency(item.discount) : "-"}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.lineTotal)}</td>
                    <td className="px-6 py-4 text-right">
                      {item.receivedQuantity != null ? Number(item.receivedQuantity) : 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-6">
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(purchaseOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Discount</span>
                <span>-{formatCurrency(purchaseOrder.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(purchaseOrder.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total</span>
                <span>{formatCurrency(purchaseOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPurchaseOrderPage;
