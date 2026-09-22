import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { purchaseService, getActiveVendors } from "../../services/purchase.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { createPurchaseSchema, type CreatePurchaseFormData } from "../../features/validation/purchase.schema";
import type { CreatePurchaseDto } from "../../types/purchase";
import type { Vendor } from "../../types/vendor";

const AddPurchasePage = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const data = await getActiveVendors();
        setVendors(data);
      } catch (error) {
        console.error("Failed to load vendors", error);
      } finally {
        setLoadingVendors(false);
      }
    };
    loadVendors();
  }, []);

  const createMutation = useMutation({
    mutationFn: (dto: CreatePurchaseDto) => purchaseService.createPurchase(dto),
    onSuccess: () => {
      toast.success("Purchase created successfully");
      navigate("/purchases");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message = axiosError.response?.data?.message || "Failed to create purchase";
        toast.error(message);
      } else {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        const message = axiosError.response?.data?.message || axiosError.message || "Failed to create purchase";
        toast.error(message);
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePurchaseFormData>({
    resolver: zodResolver(createPurchaseSchema) as any,
    defaultValues: {
      purchaseDate: new Date().toISOString().split("T")[0],
      vendorId: "",
      referenceNo: "",
      description: "",
      subtotal: 0,
      tax: 0,
      total: 0,
      paymentMethod: "CASH",
      notes: "",
    },
  });

  const onSubmit = async (data: CreatePurchaseFormData) => {
    const payload: CreatePurchaseDto = {
      ...data,
      subtotal: String(data.subtotal),
      tax: String(data.tax),
      total: String(data.total),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/purchases")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Add Purchase
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Record a new purchase order.
          </p>
        </div>
      </div>

      {vendors.length === 0 && !loadingVendors ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <h2 className="text-sm font-semibold text-yellow-800">No Active Vendors</h2>
          <p className="mt-1 text-sm text-yellow-700">
            Please create a vendor before creating a purchase.
          </p>
          <button
            onClick={() => navigate("/vendors/add")}
            className="mt-3 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 transition"
          >
            Create Vendor
          </button>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-slate-700 mb-2">
                  Purchase Date *
                </label>
                <input
                  id="purchaseDate"
                  type="date"
                  {...register("purchaseDate")}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.purchaseDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchaseDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="vendorId" className="block text-sm font-medium text-slate-700 mb-2">
                  Vendor *
                </label>
                <select
                  id="vendorId"
                  {...register("vendorId")}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {errors.vendorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.vendorId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="referenceNo" className="block text-sm font-medium text-slate-700 mb-2">
                  Reference No
                </label>
                <input
                  id="referenceNo"
                  type="text"
                  {...register("referenceNo")}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter reference number"
                />
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Method *
                </label>
                <select
                  id="paymentMethod"
                  {...register("paymentMethod")}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
                {errors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subtotal" className="block text-sm font-medium text-slate-700 mb-2">
                  Subtotal *
                </label>
                <input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  {...register("subtotal")}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.subtotal && (
                  <p className="mt-1 text-sm text-red-600">{errors.subtotal.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="tax" className="block text-sm font-medium text-slate-700 mb-2">
                  Tax
                </label>
                <input
                  id="tax"
                  type="number"
                  step="0.01"
                  {...register("tax")}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.tax && (
                  <p className="mt-1 text-sm text-red-600">{errors.tax.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="total" className="block text-sm font-medium text-slate-700 mb-2">
                  Total *
                </label>
                <input
                  id="total"
                  type="number"
                  step="0.01"
                  {...register("total")}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.total && (
                  <p className="mt-1 text-sm text-red-600">{errors.total.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter notes"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/purchases")}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create Purchase"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddPurchasePage;
