import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import { productService } from "../../services/product.service";
import { warehouseService } from "../../services/warehouse.service";
import { stockCountService } from "../../services/stock-count.service";

interface Line {
  productId: string;
  countedQuantity: number;
  notes?: string;
}

const AddStockCountPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [lines, setLines] = useState<Line[]>([]);

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

  const createMutation = useMutation({
    mutationFn: () =>
      stockCountService.create({
        warehouseId,
        notes: notes || undefined,
        lines,
      }),
    onSuccess: () => {
      toast.success("Stock count draft created");
      queryClient.invalidateQueries({ queryKey: ["stock-counts"] });
      navigate("/stock-counts");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Failed to create stock count";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error("Select a warehouse");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one line");
      return;
    }
    createMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Stock Count</h1>
          <p className="text-slate-500 mt-1">Record physical inventory and reconcile variances.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Lines</h2>
              <button
                type="button"
                onClick={() =>
                  setLines((cur) => [...cur, { productId: "", countedQuantity: 0 }])
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
              >
                <Plus size={14} /> Add Line
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Counted</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        Add at least one line.
                      </td>
                    </tr>
                  ) : (
                    lines.map((l, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <select
                            value={l.productId}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLines((cur) => cur.map((x, i) => (i === idx ? { ...x, productId: v } : x)));
                            }}
                            required
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.sku} — {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            value={l.countedQuantity}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setLines((cur) =>
                                cur.map((x, i) => (i === idx ? { ...x, countedQuantity: v } : x)),
                              );
                            }}
                            className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={l.notes ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLines((cur) =>
                                cur.map((x, i) => (i === idx ? { ...x, notes: v } : x)),
                              );
                            }}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setLines((cur) => cur.filter((_, i) => i !== idx))
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => navigate("/stock-counts")}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save size={16} /> {createMutation.isPending ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddStockCountPage;
