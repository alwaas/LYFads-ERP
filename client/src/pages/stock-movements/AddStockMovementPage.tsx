import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { productService } from "../../services/product.service";
import { warehouseService } from "../../services/warehouse.service";
import { stockMovementService } from "../../services/stock-movement.service";
import {
  StockMovementType,
  type CreateStockMovementDto,
} from "../../types/stock-movement";

const TYPE_OPTIONS: { value: keyof typeof StockMovementType; label: string }[] = [
  { value: "IN", label: "Stock In" },
  { value: "OUT", label: "Stock Out" },
  { value: "ADJUST", label: "Adjust" },
  { value: "TRANSFER", label: "Transfer" },
];

const AddStockMovementPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [type, setType] = useState<keyof typeof StockMovementType>("IN");
  const [productId, setProductId] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string>("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<string>("");
  const [referenceType, setReferenceType] = useState<string>("");
  const [referenceId, setReferenceId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const productsQuery = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productService.getAllProducts({ page: 1, limit: 1000 }),
  });
  const warehousesQuery = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => warehouseService.getAllWarehouses({ page: 1, limit: 1000 }),
  });

  const products = (productsQuery.data?.data ?? []) as Array<{ id: string; sku: string; name: string }>;
  const warehouses = (warehousesQuery.data?.data ?? []) as Array<{ id: string; name: string; isDefault?: boolean }>;

  useEffect(() => {
    if (type !== "TRANSFER" && !warehouseId && warehouses.length > 0) {
      const def = warehouses.find((w) => w.isDefault) ?? warehouses[0];
      setWarehouseId(def.id);
    }
  }, [type, warehouses, warehouseId]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateStockMovementDto) => stockMovementService.createStockMovement(dto),
    onSuccess: () => {
      toast.success("Stock movement created");
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-report"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      navigate("/stock-movements");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Failed to create stock movement";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      toast.error("Please select a product");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const dto: CreateStockMovementDto = {
      productId,
      type: StockMovementType[type],
      quantity,
      referenceType: referenceType || undefined,
      referenceId: referenceId || undefined,
      notes: notes || undefined,
      unitCost: unitCost ? Number(unitCost) : undefined,
    };

    if (type === "TRANSFER") {
      if (!sourceWarehouseId || !destinationWarehouseId) {
        toast.error("Source and destination warehouses are required for transfer");
        return;
      }
      if (sourceWarehouseId === destinationWarehouseId) {
        toast.error("Source and destination must be different");
        return;
      }
      dto.sourceWarehouseId = sourceWarehouseId;
      dto.destinationWarehouseId = destinationWarehouseId;
    } else {
      if (!warehouseId) {
        toast.error("Warehouse is required");
        return;
      }
      dto.warehouseId = warehouseId;
    }

    createMutation.mutate(dto);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Stock Movement</h1>
        <p className="text-slate-500 mt-1">Record inbound, outbound, adjustment, or transfer.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Movement Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as keyof typeof StockMovementType)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
        </div>

        {type === "TRANSFER" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Source Warehouse</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select source</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Destination Warehouse</label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select destination</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700">Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {type === "IN" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Unit Cost (optional)</label>
              <input
                type="number"
                step="0.0001"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Reference Type (optional)</label>
            <input
              type="text"
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Reference ID (optional)</label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate("/stock-movements")}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {createMutation.isPending ? "Saving..." : "Create Movement"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStockMovementPage;
