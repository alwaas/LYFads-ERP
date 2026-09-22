import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, RefreshCw, Tag, CheckCircle, XCircle } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getPlans } from "../../services/plan.service";
import type { Plan } from "../../services/tenant.service";

function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlans();
      setPlans(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load plans.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const refresh = async () => {
    try {
      setRefreshing(true);
      await loadPlans();
      toast.success("Plans refreshed.");
    } catch {
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-500 animate-pulse">Loading plans...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Plan Management
              </h1>
              <p className="text-sm text-slate-500">
                Manage SaaS plans, features, and limits.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <button
                onClick={() => navigate("/plans/add")}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                <Plus size={16} /> Add Plan
              </button>
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <Tag size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No plans found.</p>
              <button
                onClick={() => navigate("/plans/add")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                <Plus size={16} /> Create First Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/plans/${plan.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-500">{plan.code}</p>
                    </div>
                    {plan.isActive ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-gray-400" />
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl font-bold text-slate-900">
                      ${Number(plan.price).toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-500">
                      /{plan.billingInterval.toLowerCase()}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{plan.features?.length ?? 0} features</span>
                    <span>{plan.limits?.length ?? 0} limits</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default PlansPage;
