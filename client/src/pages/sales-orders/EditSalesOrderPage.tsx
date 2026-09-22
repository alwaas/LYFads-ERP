import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { PackagePlus, ArrowLeft, Trash2, Plus, CheckCircle2, XCircle, Package, Layers } from "lucide-react";
import toast from "react-hot-toast";

import { salesOrderService } from "../../services/sales-order.service";
import { getClients } from "../../services/client.service";
import { productService } from "../../services/product.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { updateSalesOrderSchema, type UpdateSalesOrderFormData } from "../../features/validation/sales-order.schema";
import type { UpdateSalesOrderDto, SalesOrderItem, CreateSalesOrderItemDto } from "../../types/sales-order";
import type { Client } from "../../types/client";
import type { SalesOrder } from "../../types/sales-order";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  FULFILLED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

interface ItemDraft {
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  tax: string;
  lineTotal: string;
}

const blankItem = (): ItemDraft => ({
  productId: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
  tax: "0",
  lineTotal: "0",
});

const computeLine = (it: ItemDraft): string => {
  const qty = Number(it.quantity) || 0;
  const price = Number(it.unitPrice) || 0;
  const disc = Number(it.discount) || 0;
  const tax = Number(it.tax) || 0;
  return (qty * price - disc + tax).toFixed(2);
};

const EditSalesOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<ItemDraft[]>([blankItem()]);
  const [existingItems, setExistingItems] = useState<SalesOrderItem[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [confirmingFulfill, setConfirmingFulfill] = useState(false);

  const { data: salesOrder, isLoading: isLoadingOrder } = useQuery<SalesOrder>({
    queryKey: ["sales-order", id],
    queryFn: () => salesOrderService.getSalesOrderById(id!),
    enabled: !!id,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => getClients(),
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ["products"],
    queryFn: () => productService.getAllProducts(),
  });

  useEffect(() => {
    if (salesOrder) {
      const readOnly =
        salesOrder.status === "FULFILLED" ||
        salesOrder.status === "CANCELLED" ||
        salesOrder.status === "CONFIRMED" ||
        salesOrder.status === "PROCESSING";
      setIsReadOnly(readOnly);
      setExistingItems(salesOrder.items || []);
    }
  }, [salesOrder]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<UpdateSalesOrderFormData>({
    resolver: zodResolver(updateSalesOrderSchema) as any,
  });

  useEffect(() => {
    if (salesOrder) {
      reset({
        orderNumber: salesOrder.orderNumber,
        clientId: salesOrder.clientId,
        orderDate: salesOrder.orderDate.split("T")[0],
        expectedDeliveryDate: salesOrder.expectedDeliveryDate
          ? salesOrder.expectedDeliveryDate.split("T")[0]
          : "",
        notes: salesOrder.notes || "",
        subtotal: salesOrder.subtotal.toString(),
        discount: salesOrder.discount.toString(),
        tax: salesOrder.tax.toString(),
        total: salesOrder.total.toString(),
      });
    }
  }, [salesOrder, reset]);

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateSalesOrderDto) => salesOrderService.updateSalesOrder(id!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      toast.success("Sales order updated successfully");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof UpdateSalesOrderFormData, { message });
        });
      } else {
        const message =
          (error as any)?.response?.data?.message ||
          (error as any)?.message ||
          "Failed to update sales order";
        toast.error(message);
      }
    },
  });

  const addItemsMutation = useMutation({
    mutationFn: (newItems: CreateSalesOrderItemDto[]) =>
      salesOrderService.addItems(id!, newItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      toast.success("Items added");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to add items",
      );
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => salesOrderService.removeItem(id!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      toast.success("Item removed");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to remove item",
      );
    },
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

  const updateDraftItem = (index: number, field: keyof ItemDraft, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], [field]: value };
      if (field === "productId") {
        const p = products.find((p: any) => p.id === value);
        if (p) cur.unitPrice = p.unitPrice?.toString() ?? cur.unitPrice;
      }
      cur.lineTotal = computeLine(cur);
      next[index] = cur;
      return next;
    });
  };

  const addDraftItem = () => setItems((prev) => [...prev, blankItem()]);

  const removeDraftItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const submitDraftItems = () => {
    const valid = items.filter(
      (i) => i.productId && Number(i.quantity) > 0 && Number(i.unitPrice) >= 0,
    );
    if (valid.length === 0) {
      toast.error("Add at least one valid item");
      return;
    }
    addItemsMutation.mutate(
      valid.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        tax: i.tax,
        lineTotal: i.lineTotal,
      })),
    );
    setItems([blankItem()]);
  };

  const onSubmit = async (data: UpdateSalesOrderFormData) => {
    if (isReadOnly) return;
    updateMutation.mutate(data as UpdateSalesOrderDto);
  };

  if (isLoadingOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading sales order...</div>
      </div>
    );
  }

  if (!salesOrder) {
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
              Edit Sales Order
            </h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[salesOrder.status] || "bg-gray-100 text-gray-800"}`}
            >
              {salesOrder.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isReadOnly
              ? "Items can only be edited while the order is in DRAFT"
              : "Update sales order details"}
          </p>
        </div>
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-700 mb-2">
                Order Number *
              </label>
              <input
                type="text"
                id="orderNumber"
                {...register("orderNumber")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              {errors.orderNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.orderNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-2">
                Client *
              </label>
              <select
                id="clientId"
                {...register("clientId")}
                disabled={isReadOnly || isLoadingClients}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-xs text-red-600">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="orderDate" className="block text-sm font-medium text-slate-700 mb-2">
                Order Date *
              </label>
              <input
                type="date"
                id="orderDate"
                {...register("orderDate")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              {errors.orderDate && (
                <p className="mt-1 text-xs text-red-600">{errors.orderDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-slate-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                id="expectedDeliveryDate"
                {...register("expectedDeliveryDate")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="subtotal" className="block text-sm font-medium text-slate-700 mb-2">
                Subtotal
              </label>
              <input
                type="number"
                id="subtotal"
                {...register("subtotal")}
                readOnly
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              />
            </div>

            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-slate-700 mb-2">
                Discount
              </label>
              <input
                type="number"
                id="discount"
                {...register("discount")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="tax" className="block text-sm font-medium text-slate-700 mb-2">
                Tax
              </label>
              <input
                type="number"
                id="tax"
                {...register("tax")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="total" className="block text-sm font-medium text-slate-700 mb-2">
                Total
              </label>
              <input
                type="number"
                id="total"
                {...register("total")}
                readOnly
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register("notes")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/sales-orders")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Package className="h-4 w-4" /> Order Items
          </h3>
        </div>

        {existingItems.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No items yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-4 py-3 font-medium text-right">Discount</th>
                  <th className="px-4 py-3 font-medium text-right">Tax</th>
                  <th className="px-4 py-3 font-medium text-right">Line Total</th>
                  {!isReadOnly && <th></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {existingItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-900">
                      {item.product?.name || item.productId}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {Number(item.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${Number(item.discount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${Number(item.tax).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ${Number(item.lineTotal).toFixed(2)}
                    </td>
                    {!isReadOnly && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeItemMutation.mutate(item.id)}
                          disabled={removeItemMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isReadOnly && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Add new items</h4>
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-4 lg:grid-cols-12 rounded-lg border border-slate-200 p-4"
                >
                  <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Product</label>
                    <select
                      value={it.productId}
                      onChange={(e) => updateDraftItem(idx, "productId", e.target.value)}
                      disabled={isLoadingProducts}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Select a product</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => updateDraftItem(idx, "quantity", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Unit Price</label>
                    <input
                      type="number"
                      value={it.unitPrice}
                      onChange={(e) => updateDraftItem(idx, "unitPrice", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
                    <input
                      type="number"
                      value={it.discount}
                      onChange={(e) => updateDraftItem(idx, "discount", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="lg:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeDraftItem(idx)}
                      disabled={items.length === 1}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addDraftItem}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" /> Add row
                </button>
                <button
                  type="button"
                  onClick={submitDraftItems}
                  disabled={addItemsMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {addItemsMutation.isPending ? "Saving..." : "Save items"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {salesOrder.status === "CANCELLED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">
            This order is cancelled and cannot be fulfilled.
          </p>
        </div>
      )}
    </div>
  );
};

export default EditSalesOrderPage;
