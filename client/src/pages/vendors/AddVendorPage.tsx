import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Store, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { vendorService } from "../../services/vendor.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { createVendorSchema, type CreateVendorFormData } from "../../features/validation/vendor.schema";
import type { CreateVendorDto } from "../../types/vendor";

const AddVendorPage = () => {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (dto: CreateVendorDto) => vendorService.createVendor(dto),
    onSuccess: () => {
      toast.success("Vendor created successfully");
      navigate("/vendors");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message = axiosError.response?.data?.message || "Failed to create vendor";
        toast.error(message);
      } else {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        const message = axiosError.response?.data?.message || axiosError.message || "Failed to create vendor";
        toast.error(message);
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateVendorFormData>({
    resolver: zodResolver(createVendorSchema) as any,
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      gstNumber: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CreateVendorFormData) => {
    const payload: CreateVendorDto = {
      ...data,
      contactPerson: data.contactPerson || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      pincode: data.pincode || undefined,
      gstNumber: data.gstNumber || undefined,
      notes: data.notes || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/vendors")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Add Vendor
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Register a new vendor or supplier.
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Vendor Name *
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter vendor name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 mb-2">
                Contact Person
              </label>
              <input
                id="contactPerson"
                type="text"
                {...register("contactPerson")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter contact person"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                id="phone"
                type="text"
                {...register("phone")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                {...register("address")}
                rows={2}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter address"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                City
              </label>
              <input
                id="city"
                type="text"
                {...register("city")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-2">
                State
              </label>
              <input
                id="state"
                type="text"
                {...register("state")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter state"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-2">
                Country
              </label>
              <input
                id="country"
                type="text"
                {...register("country")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter country"
              />
            </div>

            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-slate-700 mb-2">
                Pincode
              </label>
              <input
                id="pincode"
                type="text"
                {...register("pincode")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter pincode"
              />
            </div>

            <div>
              <label htmlFor="gstNumber" className="block text-sm font-medium text-slate-700 mb-2">
                GST Number
              </label>
              <input
                id="gstNumber"
                type="text"
                {...register("gstNumber")}
                className="w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter GST number"
              />
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
              onClick={() => navigate("/vendors")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorPage;
