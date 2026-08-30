import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { productService } from "../../services/product.service";
import type { Product } from "../../types/product";

const ViewProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["products", id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !product) {
    toast.error("Product not found");
    navigate("/products");
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/products")}
          className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Product Details
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            View product record information
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                SKU: {product.sku}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {product.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </p>
              <p className="mt-2 text-sm text-slate-900">{product.category || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Unit
              </p>
              <p className="mt-2 text-sm text-slate-900">{product.unit || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Purchase Price
              </p>
              <p className="mt-2 text-sm text-slate-900">
                {product.purchasePrice != null ? `$${Number(product.purchasePrice).toFixed(2)}` : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selling Price
              </p>
              <p className="mt-2 text-sm text-slate-900">
                {product.sellingPrice != null ? `$${Number(product.sellingPrice).toFixed(2)}` : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tax Rate
              </p>
              <p className="mt-2 text-sm text-slate-900">
                {product.taxRate != null ? `${Number(product.taxRate).toFixed(2)}%` : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reorder Level
              </p>
              <p className="mt-2 text-sm text-slate-900">
                {product.reorderLevel != null ? Number(product.reorderLevel) : "-"}
              </p>
            </div>

            {product.description && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </p>
                <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <a
            href={`/products/edit/${product.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Edit
          </a>
        </div>
      </div>
    </div>
  );
};

export default ViewProductPage;
