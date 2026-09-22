import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import UserForm from "../../components/users/UserForm";
import { createUser } from "../../services/user.service";
import { mapServerValidationErrors } from "../../features/validation/errors";

function AddUserPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (values: { fullName: string; email: string; password?: string; role: string; isActive?: boolean }) => {
    setServerErrors({});
    try {
      setLoading(true);
      await createUser({
        ...values,
        password: values.password || "",
      });
      toast.success("User created successfully.");
      navigate("/users");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ?? "Failed to create user."
        );
      }
    } finally {
      setLoading(false);
    }
  };

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
                Add New User
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Create a new user account with role assignment.
              </p>
            </div>
          </div>

          <div className="w-full">
            <UserForm loading={loading} onSubmit={handleSubmit} serverErrors={serverErrors} />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default AddUserPage;
