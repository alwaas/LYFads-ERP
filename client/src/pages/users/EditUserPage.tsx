import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import UserForm from "../../components/users/UserForm";
import { getUser, updateUserRole, updateUserStatus } from "../../services/user.service";
import type { User } from "../../types/user";
import { mapServerValidationErrors } from "../../features/validation/errors";

function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = async (values: { fullName: string; email: string; password?: string; role: string; isActive?: boolean }) => {
    if (!id || !user) return;
    setServerErrors({});
    try {
      setLoading(true);
      if (values.role && values.role !== user.role) {
        await updateUserRole(id, values.role);
      }
      if (values.isActive !== undefined && values.isActive !== user.isActive) {
        await updateUserStatus(id, values.isActive);
      }
      toast.success("User updated successfully.");
      navigate("/users");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ?? "Failed to update user."
        );
      }
    } finally {
      setLoading(false);
    }
  };

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
                Edit User
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Update user role and status.
              </p>
            </div>
          </div>

          <div className="w-full">
            <UserForm
              loading={loading}
              onSubmit={handleSubmit}
              initialData={{
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
              }}
              isEdit
              serverErrors={serverErrors}
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EditUserPage;
