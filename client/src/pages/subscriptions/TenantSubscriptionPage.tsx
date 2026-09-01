import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getTenant } from "../../services/tenant.service";
import {
  getTenantSubscription,
  assignSubscription,
  updateSubscription,
  cancelSubscription,
} from "../../services/subscription.service";
import { getPlans } from "../../services/plan.service";
import type {
  Tenant,
  TenantSubscription,
  Plan,
} from "../../services/tenant.service";

function TenantSubscriptionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(
    null,
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [trialEndDate, setTrialEndDate] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [tenantData, subscriptionData, plansData] = await Promise.all([
        getTenant(id),
        getTenantSubscription(id).catch(() => null),
        getPlans(),
      ]);
      setTenant(tenantData);
      setSubscription(subscriptionData);
      setPlans(plansData.filter((p) => p.isActive));
      if (subscriptionData) {
        setSelectedPlanId(subscriptionData.planId);
        setStatus(subscriptionData.status);
        setAutoRenew(subscriptionData.autoRenew);
        setTrialEndDate(
          subscriptionData.trialEndDate
            ? subscriptionData.trialEndDate.split("T")[0]
            : "",
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to load subscription.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !selectedPlanId) return;
    try {
      setSaving(true);
      if (subscription) {
        await updateSubscription(id, {
          planId: selectedPlanId,
          status,
          trialEndDate: trialEndDate || undefined,
          autoRenew,
        });
        toast.success("Subscription updated.");
      } else {
        await assignSubscription(id, {
          planId: selectedPlanId,
          status,
          trialEndDate: trialEndDate || undefined,
          autoRenew,
        });
        toast.success("Subscription assigned.");
      }
      loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to save subscription.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to cancel this subscription?"))
      return;
    try {
      setSaving(true);
      await cancelSubscription(id);
      toast.success("Subscription cancelled.");
      loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to cancel subscription.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle size={12} /> Active
          </span>
        );
      case "TRIAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <Clock size={12} /> Trial
          </span>
        );
      case "PAST_DUE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <AlertCircle size={12} /> Past Due
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            <XCircle size={12} /> Cancelled
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            Expired
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-500 animate-pulse">Loading...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/tenants/${id}`)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                Subscription Management
              </h1>
              <p className="text-sm text-slate-500">
                {tenant?.name} - Manage plan and subscription
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                {subscription ? "Current Subscription" : "Assign Subscription"}
              </h2>
            </div>

            {subscription && (
              <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  {getStatusBadge(subscription.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Current Plan</span>
                  <span className="text-sm font-medium text-slate-900">
                    {subscription.plan?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Start Date</span>
                  <span className="text-sm text-slate-900">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plan
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (${Number(plan.price).toFixed(2)}/
                    {plan.billingInterval.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Trial End Date
              </label>
              <input
                type="date"
                value={trialEndDate}
                onChange={(e) => setTrialEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoRenew" className="text-sm text-slate-700">
                Auto-renew subscription
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !selectedPlanId}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving
                  ? "Saving..."
                  : subscription
                    ? "Update Subscription"
                    : "Assign Subscription"}
              </button>
              {subscription && subscription.status !== "CANCELLED" && (
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default TenantSubscriptionPage;
