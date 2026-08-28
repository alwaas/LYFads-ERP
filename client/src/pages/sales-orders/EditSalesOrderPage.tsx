import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { PackagePlus, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { salesOrderService } from "../../services/sales-order.service";
import { getClients } from "../../services/client.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { updateSalesOrderSchema, type UpdateSalesOrderFormData } from "../../features/validation/sales-order.schema";
import type { UpdateSalesOrderDto } from "../../types/sales-order";
import type { Client } from "../../types/client";
import type { SalesOrder } from "../../types/sales-order";

const EditSalesOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [isReadOnly, setIsReadOnly] = useState(false);

  const { data: salesOrder, isLoading: isLoadingOrder } = useQuery<SalesOrder>({
    queryKey: ["sales-order", id],
    queryFn: () => salesOrderService.getSalesOrderById(id!),
    enabled: !!id,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => getClients(),
  });

  useEffect(() => {
    if (salesOrder) {
      if (salesOrder.status === "FULFILLED" || salesOrder.status === "CANCELLED") {
        setIsReadOnly(true);
      }
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
        expectedDeliveryDate: salesOrder.expectedDeliveryDate ? salesOrder.expectedDeliveryDate.split("T")[0] : "",
        status: salesOrder.status,
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
      navigate("/sales-orders");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof UpdateSalesOrderFormData, { message });
        });
      } else {
        const message = (error as any)?.response?.data?.message || (error as any)?.message || "Failed to update sales order";
        toast.error(message);
      }
    },
  });

  const onSubmit = async (data: UpdateSalesOrderFormData) => {
    if (isReadOnly) return;
    updateMutation.mutate(data);
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
              Edit Sales Order
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isReadOnly ? "Viewing finalized sales order" : "Update sales order details"}
          </p>
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
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                id="status"
                {...register("status")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
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

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales-orders")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSalesOrderPage;
