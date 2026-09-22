import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getUser } from "../../services/user.service";
import type { User } from "../../types/user";

function ViewUserPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!id) return;
      try {
        const data = await getUser(id);
        setUser(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load user.");
        navigate("/users");
      }
    };
    loadUser();
  }, [id, navigate]);

  if (!user) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading user...</p>
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
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex items-center gap-4">
            <button
              onClick={() => navigate("/users")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                User Details
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                View user information and access details.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Full Name</p>
                <p className="mt-1 text-sm text-slate-900">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="mt-1 text-sm text-slate-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Role</p>
                <p className="mt-1 text-sm text-slate-900">{user.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="mt-1 text-sm text-slate-900">{user.isActive ? "Active" : "Inactive"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Created At</p>
                <p className="mt-1 text-sm text-slate-900">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Updated At</p>
                <p className="mt-1 text-sm text-slate-900">{new Date(user.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewUserPage;
