import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";

type Method = "FIFO" | "WEIGHTED_AVERAGE";

export default function InventoryValuationSettings() {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<Method>("WEIGHTED_AVERAGE");

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-valuation"],
    queryFn: async () => {
      const res = await api.get("/settings/inventory-valuation");
      return res.data.data ?? res.data;
    },
  });

  useEffect(() => {
    if (data?.inventoryValuationMethod) {
      setMethod(data.inventoryValuationMethod);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (m: Method) =>
      api.patch("/settings/inventory-valuation", { inventoryValuationMethod: m }),
    onSuccess: () => {
      toast.success("Inventory valuation method updated");
      queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-report"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Failed to update";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  if (isLoading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Inventory Valuation Method</h2>
        <p className="text-sm text-slate-500 mt-1">
          Determines how inventory value and COGS are computed for this tenant.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="FIFO">FIFO (First In, First Out)</option>
          <option value="WEIGHTED_AVERAGE">Weighted Average</option>
        </select>
        <button
          onClick={() => mutation.mutate(method)}
          disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
