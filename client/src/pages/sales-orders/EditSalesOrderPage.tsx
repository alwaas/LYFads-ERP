import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { salesOrderService } from "../../services/sales-order.service";
import { productService } from "../../services/product.service";
import type { SalesOrder, UpdateSalesOrderDto, SalesOrderItemDto } from "../../types/sales-order";
import type { Product } from "../../types/product";

const EditSalesOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState<UpdateSalesOrderDto>({});
  const [items, setItems] = useState<SalesOrderItemDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const { data: salesOrder, isLoading, isError } = useQuery<SalesOrder>({
    queryKey: ["sales-orders", id],
    queryFn: () => salesOrderService.getSalesOrderById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (salesOrder) {
      setFormData({
        clientId: salesOrder.clientId,
        orderDate: salesOrder.orderDate.split("T")[0],
        expectedDeliveryDate: salesOrder.expectedDeliveryDate?.split("T")[0],
        notes: salesOrder.notes,
      });
      setItems(
        salesOrder.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discount: item.discount,
        })),
      );
    }
  }, [salesOrder]);

  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data.filter((p) => p.status === "ACTIVE"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products.");
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSalesOrderDto }) =>
      salesOrderService.updateSalesOrder(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Sales order updated successfully");
      navigate("/sales-orders");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to update sales order";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    updateMutation.mutate({ id, dto: { ...formData, items } });
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItemDto, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          newItems[index].description = product.name;
          newItems[index].unit = product.unit || "";
          newItems[index].unitPrice = product.sellingPrice || 0;
        }
      }

      return newItems;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        description: "",
        quantity: 1,
        unit: "",
        unitPrice: 0,
        taxRate: 0,
        discount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: SalesOrderItemDto) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = item.discount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
    return taxableAmount + taxAmount;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;
      discountAmount += item.discount || 0;
      const taxableAmount = itemSubtotal - (item.discount || 0);
      taxAmount += taxableAmount * ((item.taxRate || 0) / 100);
    }

    return {
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount: subtotal - discountAmount + taxAmount,
    };
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !salesOrder) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Sales order not found</h2>
      </div>
    );
  }

  const totals = calculateTotals();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Sales Order
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {salesOrder.orderNumber}
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-2">
                Client *
              </label>
              <input
                type="text"
                id="clientId"
                value={formData.clientId || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="orderDate" className="block text-sm font-medium text-slate-700 mb-2">
                Order Date *
              </label>
              <input
                type="date"
                id="orderDate"
                value={formData.orderDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, orderDate: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-slate-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                id="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No items added.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 p-4 border border-slate-200 rounded-xl">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(index, "taxRate", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, "discount", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Line Total</label>
                        <p className="text-sm font-semibold text-slate-900 mt-2">
                          {formatCurrency(calculateItemTotal(item))}
                        </p>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales-orders")}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? "Updating..." : "Update Sales Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSalesOrderPage;
