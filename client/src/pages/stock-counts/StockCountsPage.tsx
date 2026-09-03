import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import { stockCountService } from "../../services/stock-count.service";

const StockCountsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stock-counts"],
    queryFn: () => stockCountService.list(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => stockCountService.approve(id),
    onSuccess: (data) => {
      toast.success(
        data.alreadyApproved
          ? "Already approved"
          : `Approved (${data.adjustmentCount} adjustments)`,
      );
      queryClient.invalidateQueries({ queryKey: ["stock-counts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-report"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Approval failed";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const counts = (data ?? []) as Array<{ id: string; status: string; countDate: string; notes?: string; warehouse: { name: string } }>;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Stock Counts</h1>
            <p className="text-slate-500 mt-1">Physical reconciliation workflow.</p>
          </div>
          <button
            onClick={() => navigate("/stock-counts/add")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            <Plus size={16} /> New Count
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Warehouse</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-rose-600">Failed to load</td>
                  </tr>
                ) : counts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No stock counts yet.
                    </td>
                  </tr>
                ) : (
                  counts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{new Date(c.countDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{c.warehouse?.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            c.status === "APPROVED"
                              ? "inline-flex rounded-full px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800"
                              : "inline-flex rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800"
                          }
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.notes ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "DRAFT" ? (
                          <button
                            onClick={() => approveMutation.mutate(c.id)}
                            disabled={approveMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs"
                          >
                            <Check size={12} /> Approve
                          </button>
                        ) : (
                          <Link to="/stock-counts" className="text-xs text-slate-500">—</Link>
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
};

export default StockCountsPage;
