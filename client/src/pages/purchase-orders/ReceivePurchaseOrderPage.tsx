import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Truck, ArrowLeft, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { purchaseOrderService } from "../../services/purchase-order.service";
import { warehouseService } from "../../services/warehouse.service";
import type { PurchaseOrder, ReceiveItemDto } from "../../types/purchase-order";

const ReceivePurchaseOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [warehouseId, setWarehouseId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const { data: po, isLoading, isError } = useQuery<PurchaseOrder>({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrderService.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  const { data: warehousesResp } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => warehouseService.getAllWarehouses(),
  });
  const warehouses = (warehousesResp as any)?.data || [];

  const receiveMutation = useMutation({
    mutationFn: () => {
      const items: ReceiveItemDto[] = po!.items
        .map((it) => ({
          itemId: it.id,
          quantity: quantities[it.id] ?? "0",
        }))
        .filter((i) => Number(i.quantity) > 0);
      return purchaseOrderService.receivePurchaseOrder(id!, {
        warehouseId: warehouseId || (po!.warehouseId ?? ""),
        items,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast.success("Stock received");
      navigate(`/purchase-orders/${id}`);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Failed to receive");
    },
  });

  if (isLoading) return <div className="text-slate-500 text-center py-8">Loading...</div>;
  if (isError || !po) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Purchase order not found</h2>
      </div>
    );
  }

  if (po.status === "CANCELLED" || po.status === "RECEIVED") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/purchase-orders/${id}`)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Receive Stock</h1>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            This order is {po.status.toLowerCase()} and cannot receive stock.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!warehouseId && !po.warehouseId) {
      toast.error("Select a warehouse");
      return;
    }
    const any = po.items.some((it) => Number(quantities[it.id] || "0") > 0);
    if (!any) {
      toast.error("Enter at least one quantity to receive");
      return;
    }
    receiveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/purchase-orders/${id}`)} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Receive Stock</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">PO {po.orderNumber} — {po.vendor?.name}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Receiving Warehouse</label>
          <select
            value={warehouseId || po.warehouseId || ""}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a warehouse</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Ordered</th>
                <th className="px-4 py-3 font-medium text-right">Already Received</th>
                <th className="px-4 py-3 font-medium text-right">Remaining</th>
                <th className="px-4 py-3 font-medium text-right">Receive Now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.items.map((it) => {
                const ordered = Number(it.quantity);
                const received = Number(it.receivedQuantity);
                const remaining = ordered - received;
                return (
                  <tr key={it.id}>
                    <td className="px-4 py-3 text-slate-900">{it.product?.name || it.productId}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{ordered.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{received.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{remaining.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        step="0.01"
                        value={quantities[it.id] ?? ""}
                        onChange={(e) => setQuantities((prev) => ({ ...prev, [it.id]: e.target.value }))}
                        disabled={remaining <= 0}
                        placeholder="0"
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm text-right disabled:opacity-50"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Receipt Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Optional notes for this receipt"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/purchase-orders/${id}`)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={receiveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            <Truck className="h-4 w-4" />
            {receiveMutation.isPending ? "Receiving..." : "Confirm Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceivePurchaseOrderPage;
