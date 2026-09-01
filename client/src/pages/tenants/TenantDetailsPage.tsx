import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Briefcase,
  FolderKanban,
  Package,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getTenant } from "../../services/tenant.service";
import { getTenantSubscription } from "../../services/subscription.service";
import type { Tenant, TenantSubscription } from "../../services/tenant.service";

function TenantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [tenantData, subscriptionData] = await Promise.all([
        getTenant(id),
        getTenantSubscription(id).catch(() => null),
      ]);
      setTenant(tenantData);
      setSubscription(subscriptionData);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to load tenant details.",
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
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
            <AlertCircle size={12} /> Suspended
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            <XCircle size={12} /> Inactive
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
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
            Trial
          </span>
        );
      case "PAST_DUE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Past Due
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            Cancelled
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
            <p className="text-slate-500 animate-pulse">
              Loading tenant details...
            </p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-20">
            <p className="text-slate-500">Tenant not found.</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/tenants")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {tenant.name}
                </h1>
                {getStatusBadge(tenant.status)}
              </div>
              <p className="text-sm text-slate-500">{tenant.slug}</p>
            </div>
            <button
              onClick={() => navigate(`/tenants/${id}/subscription`)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Manage Subscription
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Organization Information
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Email</dt>
                  <dd className="text-sm text-slate-900">
                    {tenant.email || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Phone</dt>
                  <dd className="text-sm text-slate-900">
                    {tenant.phone || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    Address
                  </dt>
                  <dd className="text-sm text-slate-900">
                    {tenant.address || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    Timezone
                  </dt>
                  <dd className="text-sm text-slate-900">{tenant.timezone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    Currency
                  </dt>
                  <dd className="text-sm text-slate-900">{tenant.currency}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    Max Users
                  </dt>
                  <dd className="text-sm text-slate-900">{tenant.maxUsers}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    Max Storage (MB)
                  </dt>
                  <dd className="text-sm text-slate-900">{tenant.maxStorage}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Subscription
                </h2>
                {subscription ? (
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium text-slate-500">
                        Plan
                      </dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {subscription.plan?.name || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">
                        Status
                      </dt>
                      <dd>{getSubscriptionStatusBadge(subscription.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">
                        Start Date
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </dd>
                    </div>
                    {subscription.trialEndDate && (
                      <div>
                        <dt className="text-xs font-medium text-slate-500">
                          Trial End
                        </dt>
                        <dd className="text-sm text-slate-900">
                          {new Date(subscription.trialEndDate).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">No subscription found.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Usage
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <Users size={20} className="text-blue-600" />
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {tenant._count?.users ?? 0}
                      </div>
                      <div className="text-xs text-slate-500">Users</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <Briefcase size={20} className="text-green-600" />
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {tenant._count?.clients ?? 0}
                      </div>
                      <div className="text-xs text-slate-500">Clients</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <FolderKanban size={20} className="text-purple-600" />
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {tenant._count?.projects ?? 0}
                      </div>
                      <div className="text-xs text-slate-500">Projects</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <Package size={20} className="text-orange-600" />
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {tenant._count?.products ?? 0}
                      </div>
                      <div className="text-xs text-slate-500">Products</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default TenantDetailsPage;
