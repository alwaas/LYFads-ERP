import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { inventoryService } from "../../services/inventory.service";
import type { Inventory, StockMovement } from "../../types/inventory";

const ViewInventoryPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const { data: inventory, isLoading: inventoryLoading, isError: inventoryError } = useQuery<Inventory | null>({
    queryKey: ["inventory", productId],
    queryFn: () => inventoryService.getInventoryByProduct(productId!),
    enabled: !!productId,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["inventory-movements", productId],
    queryFn: () => inventoryService.getStockMovements(productId!),
    enabled: !!productId,
  });

  if (inventoryLoading || movementsLoading) {
    return <PageLoader />;
  }

  if (inventoryError || !inventory) {
    toast.error("Inventory not found");
    navigate("/inventory");
    return null;
  }

  const getStockStatus = () => {
    const quantity = Number(inventory.quantity);
    const reorderLevel = inventory.product.reorderLevel != null ? Number(inventory.product.reorderLevel) : null;

    if (quantity <= 0) {
      return { label: "OUT_OF_STOCK", color: "bg-red-100 text-red-700" };
    } else if (reorderLevel !== null && quantity <= reorderLevel) {
      return { label: "LOW_STOCK", color: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "IN_STOCK", color: "bg-green-100 text-green-700" };
  };

  const stockStatus = getStockStatus();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PURCHASE_RECEIPT: "Purchase Receipt",
      ADJUSTMENT_IN: "Adjustment In",
      ADJUSTMENT_OUT: "Adjustment Out",
    };
    return labels[type] || type;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/inventory")}
          className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {inventory.product.name}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            SKU: {inventory.product.sku}
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Inventory Details</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Quantity</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{Number(inventory.quantity)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</p>
              <p className="mt-2 text-sm text-slate-900">{inventory.product.unit || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reorder Level</p>
              <p className="mt-2 text-sm text-slate-900">
                {inventory.product.reorderLevel != null ? Number(inventory.product.reorderLevel) : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Movement History */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Movement History</h2>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-right">Quantity</th>
                <th className="px-6 py-4 text-left">Reference</th>
                <th className="px-6 py-4 text-left">Note</th>
                <th className="px-6 py-4 text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No movements found
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{formatDate(movement.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {getMovementTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {movement.quantity > 0 ? "+" : ""}
                      {Number(movement.quantity)}
                    </td>
                    <td className="px-6 py-4">
                      {movement.referenceType && movement.referenceId
                        ? `${movement.referenceType} #${movement.referenceId.slice(0, 8)}...`
                        : "-"}
                    </td>
                    <td className="px-6 py-4">{movement.note || "-"}</td>
                    <td className="px-6 py-4">
                      {movement.createdBy?.fullName || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewInventoryPage;
