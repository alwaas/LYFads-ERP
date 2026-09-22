import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { stockMovementService } from "../../services/stock-movement.service";
import PageLoader from "../../components/common/PageLoader";

const ViewStockMovementPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: movement, isLoading, isError } = useQuery({
    queryKey: ["stock-movement", id],
    queryFn: () => stockMovementService.getStockMovementById(id!),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;

  if (isError || !movement) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Stock movement not found</h2>
        <Link to="/stock-movements" className="mt-2 inline-block text-sm text-blue-600">
          ← Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Stock Movement</h1>
          <p className="text-slate-500 mt-1">Movement ID: {movement.id}</p>
        </div>
        <button
          onClick={() => navigate("/stock-movements")}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-slate-500">Type</div>
          <div className="font-semibold mt-1">{movement.type}</div>
        </div>
        <div>
          <div className="text-slate-500">Product</div>
          <div className="font-semibold mt-1">{movement.product?.name} ({movement.product?.sku})</div>
        </div>
        <div>
          <div className="text-slate-500">Quantity</div>
          <div className="font-semibold mt-1">{movement.quantity}</div>
        </div>
        <div>
          <div className="text-slate-500">Unit Cost</div>
          <div className="font-semibold mt-1">{movement.unitCost ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Total Cost</div>
          <div className="font-semibold mt-1">{movement.totalCost ?? "—"}</div>
        </div>
        {movement.warehouse && (
          <div>
            <div className="text-slate-500">Warehouse</div>
            <div className="font-semibold mt-1">{movement.warehouse.name}</div>
          </div>
        )}
        {movement.sourceWarehouse && (
          <div>
            <div className="text-slate-500">Source Warehouse</div>
            <div className="font-semibold mt-1">{movement.sourceWarehouse.name}</div>
          </div>
        )}
        {movement.destinationWarehouse && (
          <div>
            <div className="text-slate-500">Destination Warehouse</div>
            <div className="font-semibold mt-1">{movement.destinationWarehouse.name}</div>
          </div>
        )}
        <div>
          <div className="text-slate-500">Reference Type</div>
          <div className="font-semibold mt-1">{movement.referenceType ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Reference ID</div>
          <div className="font-semibold mt-1">{movement.referenceId ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Created At</div>
          <div className="font-semibold mt-1">{new Date(movement.createdAt).toLocaleString()}</div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-slate-500">Notes</div>
          <div className="font-semibold mt-1 whitespace-pre-wrap">{movement.notes ?? "—"}</div>
        </div>
      </div>
    </div>
  );
};

export default ViewStockMovementPage;
