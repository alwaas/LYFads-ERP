import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { purchaseOrderService } from "../../services/purchase-order.service";
import { vendorService } from "../../services/vendor.service";
import { warehouseService } from "../../services/warehouse.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import {
  updatePurchaseOrderSchema,
  type UpdatePurchaseOrderFormData,
} from "../../features/validation/purchase-order.schema";
import type { UpdatePurchaseOrderDto, PurchaseOrder } from "../../types/purchase-order";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-amber-100 text-amber-800",
  RECEIVED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const EditPurchaseOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [isReadOnly, setIsReadOnly] = useState(false);

  const { data: po, isLoading } = useQuery<PurchaseOrder>({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrderService.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  const { data: vendorsResp } = useQuery({
    queryKey: ["vendors-all"],
    queryFn: () => vendorService.getAllVendors({ limit: 100 }),
  });
  const vendors = (vendorsResp as any)?.data || [];

  const { data: warehousesResp } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => warehouseService.getAllWarehouses(),
  });
  const warehouses = (warehousesResp as any)?.data || [];

  useEffect(() => {
    if (po) {
      setIsReadOnly(po.status !== "DRAFT");
    }
  }, [po]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<UpdatePurchaseOrderFormData>({
    resolver: zodResolver(updatePurchaseOrderSchema) as any,
  });

  useEffect(() => {
    if (po) {
      reset({
        orderNumber: po.orderNumber,
        vendorId: po.vendorId,
        warehouseId: po.warehouseId || "",
        orderDate: po.orderDate.split("T")[0],
        expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.split("T")[0] : "",
        notes: po.notes || "",
        subtotal: po.subtotal.toString(),
        discount: po.discount.toString(),
        tax: po.tax.toString(),
        total: po.total.toString(),
      });
    }
  }, [po, reset]);

  const updateMutation = useMutation({
    mutationFn: (dto: UpdatePurchaseOrderDto) => purchaseOrderService.updatePurchaseOrder(id!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      toast.success("Purchase order updated");
      navigate("/purchase-orders");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof UpdatePurchaseOrderFormData, { message });
        });
      } else {
        toast.error(
          (error as any)?.response?.data?.message ||
            (error as any)?.message ||
            "Failed to update purchase order",
        );
      }
    },
  });

  if (isLoading) {
    return <div className="text-slate-500 text-center py-8">Loading purchase order...</div>;
  }

  if (!po) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Purchase order not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/purchase-orders")} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Purchase Order</h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[po.status] || "bg-gray-100 text-gray-800"}`}
            >
              {po.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isReadOnly ? "Items are locked once the order leaves DRAFT" : "Update draft purchase order"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d as UpdatePurchaseOrderDto))} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Order Number *</label>
              <input
                type="text"
                {...register("orderNumber")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
              {errors.orderNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.orderNumber.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vendor *</label>
              <select
                {...register("vendorId")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Select a vendor</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.vendorId && (
                <p className="mt-1 text-xs text-red-600">{errors.vendorId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Order Date *</label>
              <input
                type="date"
                {...register("orderDate")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Expected Delivery Date</label>
              <input
                type="date"
                {...register("expectedDeliveryDate")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Receiving Warehouse</label>
              <select
                {...register("warehouseId")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Default warehouse</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subtotal</label>
              <input
                type="text"
                {...register("subtotal")}
                readOnly
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
              <input
                type="text"
                {...register("discount")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
              <input
                type="text"
                {...register("tax")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Total</label>
              <input
                type="text"
                {...register("total")}
                readOnly
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea
                rows={3}
                {...register("notes")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h3>
            {po.items.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No items</p>
            ) : (
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
                    {po.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-4 py-3 text-slate-900">{it.product?.name || it.productId}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{Number(it.quantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">${Number(it.unitCost).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">${Number(it.discount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">${Number(it.tax).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{Number(it.receivedQuantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">${Number(it.lineTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!isReadOnly && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/purchase-orders")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditPurchaseOrderPage;
