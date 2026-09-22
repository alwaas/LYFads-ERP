import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { purchaseOrderService } from "../../services/purchase-order.service";
import { vendorService } from "../../services/vendor.service";
import { productService } from "../../services/product.service";
import { warehouseService } from "../../services/warehouse.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderFormData,
} from "../../features/validation/purchase-order.schema";
import type { CreatePurchaseOrderDto } from "../../types/purchase-order";

interface ItemDraft {
  productId: string;
  quantity: string;
  unitCost: string;
  discount: string;
  tax: string;
  lineTotal: string;
}

const blankItem = (): ItemDraft => ({
  productId: "",
  quantity: "1",
  unitCost: "0",
  discount: "0",
  tax: "0",
  lineTotal: "0",
});

const computeLine = (it: ItemDraft): string => {
  const qty = Number(it.quantity) || 0;
  const cost = Number(it.unitCost) || 0;
  const disc = Number(it.discount) || 0;
  const tax = Number(it.tax) || 0;
  return (qty * cost - disc + tax).toFixed(2);
};

const AddPurchaseOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ItemDraft[]>([blankItem()]);
  const [headerDiscount, setHeaderDiscount] = useState("0");
  const [headerTax, setHeaderTax] = useState("0");

  const { data: vendorsResp } = useQuery({
    queryKey: ["vendors-all"],
    queryFn: () => vendorService.getAllVendors({ limit: 100 }),
  });
  const vendors = (vendorsResp as any)?.data || [];

  const { data: productsResp } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getAllProducts(),
  });
  const products = (productsResp as any)?.data?.data || (productsResp as any)?.data || (Array.isArray(productsResp) ? productsResp : []);

  const { data: warehousesResp } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => warehouseService.getAllWarehouses(),
  });
  const warehouses = (warehousesResp as any)?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreatePurchaseOrderFormData>({
    resolver: zodResolver(createPurchaseOrderSchema) as any,
    defaultValues: {
      orderNumber: "",
      vendorId: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: "",
      notes: "",
      items: [],
      subtotal: "0",
      total: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreatePurchaseOrderDto) => purchaseOrderService.createPurchaseOrder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created");
      navigate("/purchase-orders");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CreatePurchaseOrderFormData, { message });
        });
      } else {
        const message =
          (error as any)?.response?.data?.message ||
          (error as any)?.message ||
          "Failed to create purchase order";
        toast.error(message);
      }
    },
  });

  const updateItem = (index: number, field: keyof ItemDraft, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], [field]: value };
      if (field === "productId") {
        const p = products.find((p: any) => p.id === value);
        if (p) cur.unitCost = p.costPrice?.toString() ?? cur.unitCost;
      }
      cur.lineTotal = computeLine(cur);
      next[index] = cur;
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, blankItem()]);
  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const calculateTotals = () => {
    const itemsSubtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unitCost) || 0;
      const disc = Number(item.discount) || 0;
      return sum + (qty * cost - disc);
    }, 0);
    const disc = Number(headerDiscount) || 0;
    const taxVal = Number(headerTax) || 0;
    return {
      subtotal: itemsSubtotal.toFixed(2),
      total: (itemsSubtotal - disc + taxVal).toFixed(2),
    };
  };

  const validateItems = (): boolean => {
    const errs: string[] = [];
    items.forEach((it, i) => {
      if (!it.productId) errs.push(`Item ${i + 1}: Product is required`);
      const qty = Number(it.quantity);
      if (!Number.isFinite(qty) || qty <= 0) errs.push(`Item ${i + 1}: Quantity must be > 0`);
      const cost = Number(it.unitCost);
      if (!Number.isFinite(cost) || cost < 0) errs.push(`Item ${i + 1}: Unit cost must be >= 0`);
    });
    if (errs.length > 0) {
      toast.error(errs[0]);
      return false;
    }
    return true;
  };

  const onSubmit = async (data: CreatePurchaseOrderFormData) => {
    if (!validateItems()) return;
    const { subtotal, total } = calculateTotals();
    const payload: CreatePurchaseOrderDto = {
      orderNumber: data.orderNumber,
      vendorId: data.vendorId,
      warehouseId: data.warehouseId,
      orderDate: data.orderDate,
      expectedDeliveryDate: data.expectedDeliveryDate,
      notes: data.notes,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost,
        discount: it.discount,
        tax: it.tax,
        lineTotal: it.lineTotal,
      })),
      subtotal,
      discount: headerDiscount || "0",
      tax: headerTax || "0",
      total,
    };
    createMutation.mutate(payload);
  };

  const { subtotal: displaySubtotal, total: displayTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/purchase-orders")} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Purchase Order</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Create a draft purchase order</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Order Number *</label>
              <input
                type="text"
                {...register("orderNumber")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="PO-001"
              />
              {errors.orderNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.orderNumber.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vendor *</label>
              <select
                {...register("vendorId")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {errors.orderDate && (
                <p className="mt-1 text-xs text-red-600">{errors.orderDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Expected Delivery Date</label>
              <input
                type="date"
                {...register("expectedDeliveryDate")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Receiving Warehouse</label>
              <select
                {...register("warehouseId")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                readOnly
                value={displaySubtotal}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
              <input
                type="number"
                value={headerDiscount}
                onChange={(e) => setHeaderDiscount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
              <input
                type="number"
                value={headerTax}
                onChange={(e) => setHeaderTax(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Total</label>
              <input
                type="text"
                readOnly
                value={displayTotal}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea rows={3} {...register("notes")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-4 lg:grid-cols-12 rounded-lg border border-slate-200 p-4">
                  <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Product</label>
                    <select
                      value={it.productId}
                      onChange={(e) => updateItem(idx, "productId", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost</label>
                    <input
                      type="number"
                      value={it.unitCost}
                      onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
                    <input
                      type="number"
                      value={it.discount}
                      onChange={(e) => updateItem(idx, "discount", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
                    <input
                      type="number"
                      value={it.tax}
                      onChange={(e) => updateItem(idx, "tax", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Line Total</label>
                    <input
                      type="text"
                      readOnly
                      value={it.lineTotal}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
                    />
                  </div>
                  <div className="lg:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Purchase Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseOrderPage;
