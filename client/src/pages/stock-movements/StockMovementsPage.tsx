import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";

import PageLoader from "../../components/common/PageLoader";
import { stockMovementService } from "../../services/stock-movement.service";
import type { StockMovement } from "../../types/stock-movement";
import { StockMovementType } from "../../types/stock-movement";

type PagedResponse = {
  data: StockMovement[];
  meta: {
    total: number;
  };
};

const movementTypeLabels: Record<StockMovementType, string> = {
  [StockMovementType.IN]: "In",
  [StockMovementType.OUT]: "Out",
  [StockMovementType.ADJUST]: "Adjust",
  [StockMovementType.TRANSFER]: "Transfer",
};

const movementTypeColors: Record<StockMovementType, string> = {
  [StockMovementType.IN]: "bg-green-100 text-green-800",
  [StockMovementType.OUT]: "bg-red-100 text-red-800",
  [StockMovementType.ADJUST]: "bg-yellow-100 text-yellow-800",
  [StockMovementType.TRANSFER]: "bg-blue-100 text-blue-800",
};

const StockMovementsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: result, isLoading, isError } = useQuery<PagedResponse>({
    queryKey: ["stockMovements", searchQuery, typeFilter],
    queryFn: () =>
      stockMovementService.getAllStockMovements({
        search: searchQuery || undefined,
        type: typeFilter !== "all" ? (typeFilter as StockMovementType) : undefined,
      }),
  });

  const movements = result?.data || [];
  const total = result?.meta?.total || 0;

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load stock movements</h2>
        <p className="mt-1 text-sm text-red-600">The stock movements service could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Stock Movements</h1>
          <p className="text-slate-500 mt-1">Track inventory movements and transfers.</p>
        </div>
        <button
          onClick={() => navigate("/stock-movements/add")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> New Movement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search movements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value={StockMovementType.IN}>In</option>
            <option value={StockMovementType.OUT}>Out</option>
            <option value={StockMovementType.ADJUST}>Adjust</option>
            <option value={StockMovementType.TRANSFER}>Transfer</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Warehouse</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => navigate(`/stock-movements/${movement.id}`)}>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          movementTypeColors[movement.type]
                        }`}
                      >
                        {movementTypeLabels[movement.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {movement.product.name} <span className="text-slate-500">({movement.product.sku})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {movement.type === StockMovementType.TRANSFER ? (
                        <span>
                          {movement.sourceWarehouse?.name || "-"} → {movement.destinationWarehouse?.name || "-"}
                        </span>
                      ) : (
                        movement.warehouse?.name || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{movement.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {movement.referenceType && movement.referenceId
                        ? `${movement.referenceType}: ${movement.referenceId}`
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">Total movements: {total}</p>
        </div>
      </div>
    </div>
  );
};

export default StockMovementsPage;
