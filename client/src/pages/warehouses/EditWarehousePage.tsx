import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { warehouseService } from "../../services/warehouse.service";
import { editWarehouseSchema, type EditWarehouseFormData } from "../../features/validation/warehouse.schema";
import type { UpdateWarehouseDto } from "../../types/warehouse";

const EditWarehousePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => warehouseService.getWarehouseById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWarehouseDto }) =>
      warehouseService.updateWarehouse(id, dto),
    onSuccess: () => {
      toast.success("Warehouse updated successfully");
      navigate("/warehouses");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || "Failed to update warehouse";
      toast.error(message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditWarehouseFormData>({
    resolver: zodResolver(editWarehouseSchema) as any,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12 text-slate-500">Warehouse not found</div>
    );
  }

  const onSubmit = (data: EditWarehouseFormData) => {
    if (!id) return;
    const payload: UpdateWarehouseDto = {
      ...data,
      location: data.location || undefined,
    };
    updateMutation.mutate({ id, dto: payload });
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Warehouse</h1>
          <p className="text-slate-500 mt-1">Update warehouse details.</p>
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
              disabled={updateMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {updateMutation.isPending ? "Updating..." : "Update Warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWarehousePage;
