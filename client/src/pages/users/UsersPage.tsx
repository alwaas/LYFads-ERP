import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import UserTable from "../../components/users/UserTable";
import Pagination from "../../components/ui/Pagination";
import { getUsers, deleteUser } from "../../services/user.service";
import type { User } from "../../types/user";

function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result: any = await getUsers(page, limit, search);
      setUsers(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, limit]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      const result: any = await getUsers(page, limit, search);
      setUsers(result.data || []);
      setTotalPages(result.totalPages || 1);
      toast.success("Users refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((x) => x.id !== id));
      toast.success("User deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const safeUsers = Array.isArray(users) ? users : [];

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading users...</p>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Users
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage system users and access
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate("/users/add")}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {safeUsers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500">No users found.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <UserTable
                  users={safeUsers}
                  onView={(id) => navigate(`/users/view/${id}`)}
                  onEdit={(id) => navigate(`/users/edit/${id}`)}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>

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

export default UsersPage;
