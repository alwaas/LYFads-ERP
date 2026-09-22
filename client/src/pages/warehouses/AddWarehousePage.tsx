import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { warehouseService } from "../../services/warehouse.service";
import { createWarehouseSchema, type CreateWarehouseFormData } from "../../features/validation/warehouse.schema";
import type { CreateWarehouseDto } from "../../types/warehouse";

const AddWarehousePage = () => {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (dto: CreateWarehouseDto) => warehouseService.createWarehouse(dto),
    onSuccess: () => {
      toast.success("Warehouse created successfully");
      navigate("/warehouses");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || "Failed to create warehouse";
      toast.error(message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWarehouseFormData>({
    resolver: zodResolver(createWarehouseSchema) as any,
    defaultValues: {
      name: "",
      location: "",
      isDefault: false,
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateWarehouseFormData) => {
    const payload: CreateWarehouseDto = {
      ...data,
      location: data.location || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/warehouses")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add Warehouse</h1>
          <p className="text-slate-500 mt-1">Create a new inventory location.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Name *</label>
              <input
                {...register("name")}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter warehouse name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                {...register("location")}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter location"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                {...register("isDefault")}
                type="checkbox"
                id="isDefault"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-slate-700">
                Set as default warehouse
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                {...register("isActive")}
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/warehouses")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWarehousePage;
