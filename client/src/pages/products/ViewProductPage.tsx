import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, AlertTriangle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { productService } from "../../services/product.service";

const ViewProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ["products", id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12 text-slate-500">Product not found</div>
    );
  }

  const isLowStock = product.stockQuantity <= product.minStockLevel;

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <p className="text-slate-500 mt-1">SKU: {product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Stock Quantity</p>
              <p className={`text-2xl font-bold ${isLowStock ? "text-red-600" : "text-slate-900"}`}>
                {product.stockQuantity}
              </p>
            </div>
          </div>
          {isLowStock && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle size={16} />
              <span>Low stock (min: {product.minStockLevel})</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-sm text-slate-500">Unit Price</p>
          <p className="text-2xl font-bold text-slate-900">${product.unitPrice.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-sm text-slate-500">Cost Price</p>
          <p className="text-2xl font-bold text-slate-900">${product.costPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">SKU</dt>
            <dd className="text-sm font-medium text-slate-900">{product.sku}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="text-sm font-medium text-slate-900">{product.name}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm text-slate-500">Description</dt>
            <dd className="text-sm font-medium text-slate-900">{product.description || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Minimum Stock Level</dt>
            <dd className="text-sm font-medium text-slate-900">{product.minStockLevel}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Status</dt>
            <dd className="text-sm font-medium text-slate-900">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  product.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {product.warehouseStocks && product.warehouseStocks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Warehouse Stock</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Warehouse</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Location</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {product.warehouseStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">{stock.warehouse.name}</td>
                    <td className="px-4 py-3 text-slate-600">{stock.warehouse.location || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{stock.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProductPage;
