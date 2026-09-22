import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PackagePlus, ArrowLeft, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { salesOrderService } from "../../services/sales-order.service";
import { getClients } from "../../services/client.service";
import { productService } from "../../services/product.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { createSalesOrderSchema, type CreateSalesOrderFormData } from "../../features/validation/sales-order.schema";
import type { CreateSalesOrderDto } from "../../types/sales-order";
import type { Client } from "../../types/client";

interface SalesOrderItem {
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  tax: string;
  lineTotal: string;
}

const blankItem = (): SalesOrderItem => ({
  productId: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
  tax: "0",
  lineTotal: "0",
});

const computeLine = (it: SalesOrderItem): string => {
  const qty = Number(it.quantity) || 0;
  const price = Number(it.unitPrice) || 0;
  const disc = Number(it.discount) || 0;
  const tax = Number(it.tax) || 0;
  return (qty * price - disc + tax).toFixed(2);
};

const AddSalesOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<SalesOrderItem[]>([blankItem()]);
  const [headerDiscount, setHeaderDiscount] = useState("0");
  const [headerTax, setHeaderTax] = useState("0");

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => getClients(),
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ["products"],
    queryFn: () => productService.getAllProducts(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateSalesOrderFormData>({
    resolver: zodResolver(createSalesOrderSchema) as any,
    defaultValues: {
      orderNumber: "",
      clientId: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: "",
      notes: "",
      items: [],
      subtotal: "0",
      total: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateSalesOrderDto) => salesOrderService.createSalesOrder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Sales order created successfully");
      navigate("/sales-orders");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CreateSalesOrderFormData, { message });
        });
      } else {
        const message =
          (error as any)?.response?.data?.message ||
          (error as any)?.message ||
          "Failed to create sales order";
        toast.error(message);
      }
    },
  });

  const updateItem = (index: number, field: keyof SalesOrderItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], [field]: value };
      if (field === "productId") {
        const p = products.find((p) => p.id === value);
        if (p) cur.unitPrice = p.unitPrice?.toString() ?? cur.unitPrice;
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
      const price = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      return sum + (qty * price - disc);
    }, 0);
    const disc = Number(headerDiscount) || 0;
    const taxVal = Number(headerTax) || 0;
    const totalVal = itemsSubtotal - disc + taxVal;
    return {
      subtotal: itemsSubtotal.toFixed(2),
      total: totalVal.toFixed(2),
    };
  };

  const validateItems = (): boolean => {
    const errors: string[] = [];
    items.forEach((item, index) => {
      if (!item.productId) errors.push(`Item ${index + 1}: Product is required`);
      const qty = Number(item.quantity);
      if (Number.isNaN(qty) || qty <= 0) errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      const price = Number(item.unitPrice);
      if (Number.isNaN(price) || price < 0) errors.push(`Item ${index + 1}: Unit price must be 0 or greater`);
    });
    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }
    return true;
  };

  const onSubmit = async (data: CreateSalesOrderFormData) => {
    if (!validateItems()) return;
    const { subtotal: calcSubtotal, total: calcTotal } = calculateTotals();
    const payload: CreateSalesOrderDto = {
      orderNumber: data.orderNumber,
      clientId: data.clientId,
      orderDate: data.orderDate,
      expectedDeliveryDate: data.expectedDeliveryDate,
      notes: data.notes,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        lineTotal: item.lineTotal,
      })),
      subtotal: calcSubtotal,
      discount: headerDiscount || "0",
      tax: headerTax || "0",
      total: calcTotal,
    };
    createMutation.mutate(payload);
  };

  const { subtotal: displaySubtotal, total: displayTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/sales-orders")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Add Sales Order
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Create a new sales order</p>
        </div>
      </div>

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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="SO-001"
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
                disabled={isLoadingClients}
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="subtotal" className="block text-sm font-medium text-slate-700 mb-2">
                Subtotal
              </label>
              <input
                type="number"
                id="subtotal"
                value={displaySubtotal}
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
                value={headerDiscount}
                onChange={(e) => setHeaderDiscount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="tax" className="block text-sm font-medium text-slate-700 mb-2">
                Tax
              </label>
              <input
                type="number"
                id="tax"
                value={headerTax}
                onChange={(e) => setHeaderTax(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="total" className="block text-sm font-medium text-slate-700 mb-2">
                Total
              </label>
              <input
                type="number"
                id="total"
                value={displayTotal}
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 lg:grid-cols-12 rounded-lg border border-slate-200 p-4">
                  <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                      disabled={isLoadingProducts}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="1"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Unit Price</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => updateItem(index, "discount", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Line Total</label>
                    <input
                      type="number"
                      value={item.lineTotal}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
                    />
                  </div>

                  <div className="lg:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
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
              onClick={() => navigate("/sales-orders")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Sales Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalesOrderPage;
