import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, DollarSign, Layers } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getInventoryReport } from "../../services/report.service";
import type { InventoryReport } from "../../types/report";

function InventoryReportPage() {
  const { data, isLoading, isError } = useQuery<InventoryReport>({
    queryKey: ["inventory-report"],
    queryFn: () => getInventoryReport(),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading inventory report...</div>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-sm font-semibold text-red-800">Unable to load inventory report</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory Report</h1>
            <p className="text-slate-500 mt-1">
              Valuation method:{" "}
              <span className="font-semibold text-slate-700">{data.valuationMethod}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Total Products</div>
              <Package className="text-blue-500" size={20} />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{data.totalProducts}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Total Stock Quantity</div>
              <Layers className="text-indigo-500" size={20} />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{data.totalStockQuantity}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Inventory Value</div>
              <DollarSign className="text-emerald-500" size={20} />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {data.totalStockValue.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Low Stock Items</div>
              <AlertTriangle className="text-amber-500" size={20} />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{data.lowStockCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Warehouse Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Warehouse</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Distinct Products</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Total Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.warehouseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No warehouses configured.
                    </td>
                  </tr>
                ) : (
                  data.warehouseBreakdown.map((w) => (
                    <tr key={w.warehouseId}>
                      <td className="px-4 py-3 font-medium text-slate-900">{w.warehouseName}</td>
                      <td className="px-4 py-3 text-slate-600">{w.productCount}</td>
                      <td className="px-4 py-3 text-slate-600">{w.totalQuantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Product Stock</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">On Hand</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Min Level</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Value</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  data.products.map((p) => (
                    <tr key={p.id} className={p.isLowStock ? "bg-amber-50" : ""}>
                      <td className="px-4 py-3 font-mono text-slate-700">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.stockQuantity}</td>
                      <td className="px-4 py-3 text-slate-600">{p.minStockLevel}</td>
                      <td className="px-4 py-3 text-slate-600">{p.totalValue.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {p.isLowStock ? (
                          <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default InventoryReportPage;
