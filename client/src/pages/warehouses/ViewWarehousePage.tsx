import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Warehouse as WarehouseIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { warehouseService } from "../../services/warehouse.service";

const ViewWarehousePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => warehouseService.getWarehouseById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12 text-slate-500">Warehouse not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/warehouses")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{warehouse.name}</h1>
          <p className="text-slate-500 mt-1">Warehouse details and stock summary.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <WarehouseIcon className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Stock Movements</p>
              <p className="text-2xl font-bold text-slate-900">
                {warehouse._count?.stockMovements || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-sm text-slate-500">Status</p>
          <p className="text-2xl font-bold text-slate-900">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                warehouse.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {warehouse.isActive ? "Active" : "Inactive"}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-sm text-slate-500">Default Warehouse</p>
          <p className="text-2xl font-bold text-slate-900">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                warehouse.isDefault
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {warehouse.isDefault ? "Yes" : "No"}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Warehouse Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="text-sm font-medium text-slate-900">{warehouse.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Location</dt>
            <dd className="text-sm font-medium text-slate-900">{warehouse.location || "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ViewWarehousePage;
