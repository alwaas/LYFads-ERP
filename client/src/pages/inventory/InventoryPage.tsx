import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { inventoryService } from "../../services/inventory.service";
import type { Inventory } from "../../types/inventory";

function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      const data = await inventoryService.getInventory();
      setInventory(Array.isArray(data) ? data : []);
      toast.success("Inventory refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const getStockStatus = (item: Inventory) => {
    const quantity = Number(item.quantity);
    const reorderLevel = item.product.reorderLevel != null ? Number(item.product.reorderLevel) : null;

    if (quantity <= 0) {
      return { label: "OUT_OF_STOCK", color: "bg-red-100 text-red-700" };
    } else if (reorderLevel !== null && quantity <= reorderLevel) {
      return { label: "LOW_STOCK", color: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "IN_STOCK", color: "bg-green-100 text-green-700" };
  };

  const filteredInventory = inventory.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(keyword) ||
      item.product.sku.toLowerCase().includes(keyword)
    );
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
                  Inventory
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Monitor stock levels and inventory balances.
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
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
            />
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
              <p className="text-slate-500 text-base animate-pulse font-medium">Loading Inventory...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-2xs space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Inventory Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {search ? "No inventory matches your search criteria." : "Inventory will appear when products are received from purchase orders."}
              </p>
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Product</th>
                      <th className="px-6 py-4 text-left">SKU</th>
                      <th className="px-6 py-4 text-right">Quantity</th>
                      <th className="px-6 py-4 text-left">Unit</th>
                      <th className="px-6 py-4 text-right">Reorder Level</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-500">
                          No Inventory Found
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const stockStatus = getStockStatus(item);
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <p className="font-semibold">{item.product.name}</p>
                            </td>
                            <td className="px-6 py-4">
                              {item.product.sku}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {Number(item.quantity)}
                            </td>
                            <td className="px-6 py-4">
                              {item.product.unit || "-"}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {item.product.reorderLevel != null ? Number(item.product.reorderLevel) : "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <a
                                href={`/inventory/${item.productId}`}
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            </td>
                          </tr>
                        );
                      })
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

export default InventoryPage;
