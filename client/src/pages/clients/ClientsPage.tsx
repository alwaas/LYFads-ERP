import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import ClientTable from "../../components/clients/ClientTable";
import Pagination from "../../components/ui/Pagination";

import { getClients, deleteClient } from "../../services/client.service";
import type { Client } from "../../types/client";

function ClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadClients = async () => {
    try {
      setLoading(true);
      const result: any = await getClients(page, limit, search);
      setClients(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [page, limit]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      const result: any = await getClients(page, limit, search);
      setClients(result.data || []);
      setTotalPages(result.totalPages || 1);
      toast.success("Clients refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((x) => x.id !== id));
      toast.success("Client deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading clients...</p>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">

          {/* Header Section */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Clients Management
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Manage and monitor all your business clients efficiently.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={refresh}
                  disabled={refreshing}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition font-medium text-sm shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => navigate("/clients/add")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Client</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, company or email..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
            />
          </div>

          {/* Table Content */}
          {clients.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-2xs space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Clients Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {search ? "No clients match your search criteria." : "Start by adding your first client."}
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/clients/add")}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={16} /> Add Client
                </button>
              )}
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <ClientTable clients={clients} onDelete={handleDelete} />
              </div>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ClientsPage;
