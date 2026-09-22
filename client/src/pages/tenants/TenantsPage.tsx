import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  RefreshCw,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import Pagination from "../../components/ui/Pagination";
import {
  getTenants,
  activateTenant,
  suspendTenant,
  deactivateTenant,
} from "../../services/tenant.service";
import type { Tenant } from "../../services/tenant.service";

function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const result = await getTenants({ page, limit, search });
      setTenants(result.data);
      setTotalPages(result.totalPages);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load tenants.");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [page, limit]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page === 1) {
        loadTenants();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      await loadTenants();
      toast.success("Tenants refreshed.");
    } catch {
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateTenant(id);
      toast.success("Tenant activated.");
      loadTenants();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Activation failed.");
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await suspendTenant(id);
      toast.success("Tenant suspended.");
      loadTenants();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Suspend failed.");
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateTenant(id);
      toast.success("Tenant deactivated.");
      loadTenants();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Deactivation failed.");
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

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-500 animate-pulse">Loading tenants...</p>
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
                Tenant Management
              </h1>
              <p className="text-sm text-slate-500">
                Manage platform tenants and their status.
              </p>
            </div>
            <button
              onClick={() => navigate("/tenants/add")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Add Tenant
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenants..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Tenant
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Slug
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    Users
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Building2
                        size={40}
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="text-slate-500">No tenants found.</p>
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/tenants/${tenant.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {tenant.name}
                        </div>
                        {tenant.email && (
                          <div className="text-xs text-slate-500">
                            {tenant.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {tenant.slug}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(tenant.status)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {tenant._count?.users ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tenant.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleActivate(tenant.id)}
                              className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                            >
                              Activate
                            </button>
                          )}
                          {tenant.status === "ACTIVE" && (
                            <button
                              onClick={() => handleSuspend(tenant.id)}
                              className="rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100 transition"
                            >
                              Suspend
                            </button>
                          )}
                          {tenant.status !== "INACTIVE" && (
                            <button
                              onClick={() => handleDeactivate(tenant.id)}
                              className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default TenantsPage;
