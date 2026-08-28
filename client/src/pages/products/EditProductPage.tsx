import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { productService } from "../../services/product.service";
import { editProductSchema, type EditProductFormData } from "../../features/validation/product.schema";
import type { UpdateProductDto } from "../../types/product";

const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ["products", id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) =>
      productService.updateProduct(id, dto),
    onSuccess: () => {
      toast.success("Product updated successfully");
      navigate("/products");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || "Failed to update product";
      toast.error(message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema) as any,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12 text-slate-500">Product not found</div>
    );
  }

  const onSubmit = (data: EditProductFormData) => {
    if (!id) return;
    const payload: UpdateProductDto = {
      ...data,
      description: data.description || undefined,
    };
    updateMutation.mutate({ id, dto: payload });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/products")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Product</h1>
          <p className="text-slate-500 mt-1">Update product details.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
              <input
                {...register("sku")}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. PROD-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <input
                {...register("name")}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter product name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter product description"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
              <input
                {...register("unitPrice")}
                type="text"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
              {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
              <input
                {...register("costPrice")}
                type="text"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
              {errors.costPrice && <p className="mt-1 text-sm text-red-600">{errors.costPrice.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stock Level</label>
              <input
                {...register("minStockLevel")}
                type="text"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.minStockLevel && <p className="mt-1 text-sm text-red-600">{errors.minStockLevel.message}</p>}
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
              onClick={() => navigate("/products")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {updateMutation.isPending ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;
