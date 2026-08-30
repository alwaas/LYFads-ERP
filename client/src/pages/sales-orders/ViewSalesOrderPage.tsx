import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { salesOrderService } from "../../services/sales-order.service";
import type { SalesOrder, SalesOrderStatus } from "../../types/sales-order";

const statusColors: Record<SalesOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PARTIALLY_FULFILLED: "bg-orange-100 text-orange-700",
  FULFILLED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const ViewSalesOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillQuantities, setFulfillQuantities] = useState<Record<string, number>>({});

  const { data: salesOrder, isLoading, isError, refetch } = useQuery<SalesOrder>({
    queryKey: ["sales-orders", id],
    queryFn: () => salesOrderService.getSalesOrderById(id!),
    enabled: !!id,
  });

  const handleWorkflow = async (action: string) => {
    if (!id || !salesOrder) return;

    try {
      switch (action) {
        case "submit":
          await salesOrderService.submitSalesOrder(id);
          break;
        case "approve":
          await salesOrderService.approveSalesOrder(id);
          break;
        case "reject":
          await salesOrderService.rejectSalesOrder(id);
          break;
        case "cancel":
          if (!window.confirm("Are you sure you want to cancel this sales order?")) return;
          await salesOrderService.cancelSalesOrder(id);
          break;
        default:
          return;
      }
      toast.success(`Sales order ${action}ed successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} sales order`);
    }
  };

  const handleFulfill = async () => {
    if (!id || !salesOrder) return;

    const items = salesOrder.items.map((item) => ({
      itemId: item.id,
      fulfillQuantity: fulfillQuantities[item.id] || 0,
    }));

    if (items.every((item) => item.fulfillQuantity === 0)) {
      toast.error("Please enter fulfillment quantities.");
      return;
    }

    try {
      setFulfilling(true);
      await salesOrderService.fulfillSalesOrder(id, items);
      toast.success("Sales order fulfilled successfully");
      refetch();
      setFulfillQuantities({});
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fulfill sales order");
    } finally {
      setFulfilling(false);
    }
  };

  const handlePartialFulfill = async () => {
    if (!id || !salesOrder) return;

    const quantities = prompt(
      "Enter fulfillment quantities for each item (comma separated):"
    );
    if (!quantities) return;

    const values = quantities.split(",").map((q) => parseFloat(q.trim()));
    if (values.some(isNaN)) {
      toast.error("Invalid quantities");
      return;
    }

    const items = salesOrder.items.map((item, index) => ({
      itemId: item.id,
      fulfillQuantity: values[index] || 0,
    }));

    try {
      setFulfilling(true);
      await salesOrderService.fulfillSalesOrder(id, items);
      toast.success("Sales order fulfilled successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fulfill sales order");
    } finally {
      setFulfilling(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !salesOrder) {
    toast.error("Sales order not found");
    navigate("/sales-orders");
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
          onClick={() => navigate("/sales-orders")}
          className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {salesOrder.orderNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[salesOrder.status]}`}>
              {salesOrder.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {salesOrder.client.companyName}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {salesOrder.status === "DRAFT" && (
          <>
            <a
              href={`/sales-orders/edit/${salesOrder.id}`}
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

        {salesOrder.status === "SUBMITTED" && (
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

        {(salesOrder.status === "APPROVED" || salesOrder.status === "PARTIALLY_FULFILLED") && (
          <button
            onClick={handlePartialFulfill}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
          >
            Fulfill
          </button>
        )}
      </div>

      {/* Details */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Sales Order Details</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client</p>
              <p className="mt-2 text-sm text-slate-900">{salesOrder.client.companyName}</p>
              <p className="text-xs text-slate-500">{salesOrder.client.contactPerson}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Date</p>
              <p className="mt-2 text-sm text-slate-900">{formatDate(salesOrder.orderDate)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Delivery</p>
              <p className="mt-2 text-sm text-slate-900">
                {salesOrder.expectedDeliveryDate ? formatDate(salesOrder.expectedDeliveryDate) : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subtotal</p>
              <p className="mt-2 text-sm text-slate-900">{formatCurrency(salesOrder.subtotal)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax</p>
              <p className="mt-2 text-sm text-slate-900">{formatCurrency(salesOrder.taxAmount)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discount</p>
              <p className="mt-2 text-sm text-slate-900">{formatCurrency(salesOrder.discountAmount)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(salesOrder.totalAmount)}</p>
            </div>

            {salesOrder.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{salesOrder.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Items</h2>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-right">Quantity</th>
                <th className="px-6 py-4 text-left">Unit</th>
                <th className="px-6 py-4 text-right">Unit Price</th>
                <th className="px-6 py-4 text-right">Line Total</th>
                <th className="px-6 py-4 text-right">Fulfilled</th>
                <th className="px-6 py-4 text-right">Remaining</th>
                {(salesOrder.status === "APPROVED" || salesOrder.status === "PARTIALLY_FULFILLED") && (
                  <th className="px-6 py-4 text-center">Fulfill Qty</th>
                )}
              </tr>
            </thead>
            <tbody>
              {salesOrder.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                salesOrder.items.map((item) => {
                  const remaining = Number(item.quantity) - Number(item.fulfilledQuantity || 0);
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {item.product?.name || item.productId}
                      </td>
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 text-right">{item.quantity}</td>
                      <td className="px-6 py-4">{item.unit || "-"}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.lineTotal)}</td>
                      <td className="px-6 py-4 text-right">{item.fulfilledQuantity || 0}</td>
                      <td className="px-6 py-4 text-right">{remaining}</td>
                      {(salesOrder.status === "APPROVED" || salesOrder.status === "PARTIALLY_FULFILLED") && (
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={fulfillQuantities[item.id] || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setFulfillQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.min(val, remaining),
                              }));
                            }}
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(salesOrder.status === "APPROVED" || salesOrder.status === "PARTIALLY_FULFILLED") && (
        <div className="flex justify-end">
          <button
            onClick={handleFulfill}
            disabled={fulfilling}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50"
          >
            {fulfilling ? "Fulfilling..." : "Fulfill Order"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewSalesOrderPage;
