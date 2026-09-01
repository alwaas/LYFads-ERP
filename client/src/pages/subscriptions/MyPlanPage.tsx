import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Infinity,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import {
  getCurrentSubscription,
  getCurrentUsage,
  getCurrentEntitlements,
} from "../../services/subscription.service";
import type {
  TenantSubscription,
  UsageItem,
  Entitlements,
} from "../../services/tenant.service";

function MyPlanPage() {
  const [subscription, setSubscription] = useState<TenantSubscription | null>(
    null,
  );
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sub, usageData, entData] = await Promise.all([
        getCurrentSubscription().catch(() => null),
        getCurrentUsage(),
        getCurrentEntitlements(),
      ]);
      setSubscription(sub);
      setUsage(usageData.usage);
      setEntitlements(entData);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to load plan data.",
      );
    } finally {
      setLoading(false);
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
            <p className="text-slate-500 animate-pulse">Loading plan...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Current Plan</h1>
            <p className="text-sm text-slate-500">
              View your current plan, subscription status, and usage.
            </p>
          </div>

          {!subscription ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <CreditCard size={40} className="mx-auto mb-3 text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                No Active Subscription
              </h2>
              <p className="text-sm text-slate-500">
                You don't have an active subscription. Please contact support.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Subscription Details
                </h2>
                <dl className="space-y-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">Plan</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {subscription.plan?.name}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">Status</dt>
                    <dd>{getStatusBadge(subscription.status)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">Price</dt>
                    <dd className="text-sm text-slate-900">
                      ${Number(subscription.plan?.price ?? 0).toFixed(2)}/
                      {subscription.plan?.billingInterval.toLowerCase()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">Start Date</dt>
                    <dd className="text-sm text-slate-900">
                      {new Date(subscription.startDate).toLocaleDateString()}
                    </dd>
                  </div>
                  {subscription.trialEndDate && (
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-slate-500">Trial End</dt>
                      <dd className="text-sm text-slate-900">
                        {new Date(subscription.trialEndDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">Auto-Renew</dt>
                    <dd className="text-sm text-slate-900">
                      {subscription.autoRenew ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Plan Features
                </h2>
                {entitlements && entitlements.features.length > 0 ? (
                  <ul className="space-y-2">
                    {entitlements.features.map((feature) => (
                      <li
                        key={feature.featureCode}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <CheckCircle
                          size={16}
                          className="text-green-500 flex-shrink-0"
                        />
                        <span>{feature.featureCode}</span>
                        {feature.description && (
                          <span className="text-slate-400">
                            - {feature.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No specific features defined.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Usage
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usage.map((item) => (
                <div
                  key={item.resource}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {item.resource.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    {item.unlimited ? (
                      <Infinity size={16} className="text-blue-500" />
                    ) : null}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {item.used}
                    </span>
                    {!item.unlimited && item.limit !== null && (
                      <span className="text-sm text-slate-500">
                        / {item.limit}
                      </span>
                    )}
                    {item.unlimited && (
                      <span className="text-sm text-blue-600">unlimited</span>
                    )}
                  </div>
                  {!item.unlimited && item.remaining !== null && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.remaining <= 0
                              ? "bg-red-500"
                              : item.limit && item.used / item.limit > 0.8
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              item.limit
                                ? (item.used / item.limit) * 100
                                : 0,
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.remaining} remaining
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default MyPlanPage;
