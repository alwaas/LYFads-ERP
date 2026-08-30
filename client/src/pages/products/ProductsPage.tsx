import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { productService } from "../../services/product.service";
import type { Product, ProductStatus } from "../../types/product";

const statuses: { value: ProductStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      const data = await productService.getAllProducts();
      setProducts(data);
      toast.success("Products refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this product?")) return;

    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((x) => x.id !== id));
      toast.success("Product deactivated successfully.");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Deactivate failed.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(keyword) ||
      product.sku.toLowerCase().includes(keyword) ||
      (product.description ?? "").toLowerCase().includes(keyword) ||
      (product.category ?? "").toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "ALL" || product.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">

          {/* Header Section */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Products
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Manage your product catalog and inventory items.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={refresh}
                  disabled={refreshing}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition font-medium text-sm shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => navigate("/products/add")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Product</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU or category..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductStatus | "ALL")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
              <p className="text-slate-500 text-base animate-pulse font-medium">Loading Products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-2xs space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Products Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {search || statusFilter !== "ALL"
                  ? "No products match your search criteria."
                  : "Start by adding your first product."}
              </p>
              {!search && statusFilter === "ALL" && (
                <button
                  onClick={() => navigate("/products/add")}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={16} /> Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">SKU</th>
                      <th className="px-6 py-4 text-left">Name</th>
                      <th className="px-6 py-4 text-left">Category</th>
                      <th className="px-6 py-4 text-left">Unit</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-500">
                          No Products Found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-semibold">{product.sku}</p>
                          </td>
                          <td className="px-6 py-4">
                            {product.name}
                          </td>
                          <td className="px-6 py-4">
                            {product.category || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {product.unit || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                product.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <a
                                href={`/products/${product.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                              <a
                                href={`/products/edit/${product.id}`}
                                className="text-green-600 hover:underline"
                              >
                                Edit
                              </a>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:underline"
                              >
                                Deactivate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ProductsPage;
