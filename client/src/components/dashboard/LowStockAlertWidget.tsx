import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import { getInventoryReport } from "../../services/report.service";

function LowStockAlertWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-report-lowstock"],
    queryFn: () => getInventoryReport(),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-500">Loading low stock...</div>
      </div>
    );
  }

  if (!data || data.lowStockCount === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-emerald-600" size={18} />
          <div>
            <div className="text-sm font-semibold text-emerald-800">All stock levels OK</div>
            <div className="text-xs text-emerald-700">No products at or below minimum level.</div>
          </div>
        </div>
      </div>
    );
  }

  const lowStock = (data.products ?? []).filter((p) => p.isLowStock).slice(0, 5);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-amber-600" size={18} />
          <div className="text-sm font-semibold text-amber-800">
            {data.lowStockCount} product(s) low on stock
          </div>
        </div>
        <Link
          to="/reports/inventory"
          className="text-xs font-medium text-amber-700 hover:text-amber-900"
        >
          View report →
        </Link>
      </div>
      <ul className="space-y-1">
        {lowStock.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-xs">
            <span className="font-mono text-amber-900">{p.sku}</span>
            <span className="text-amber-800">{p.name}</span>
            <span className="text-amber-700">
              {p.stockQuantity} / {p.minStockLevel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LowStockAlertWidget;
