import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import MyProfileForm from "../../components/employees/MyProfileForm";
import { getMyProfile, updateSelfProfile } from "../../services/employee.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { useAuthStore } from "../../stores/auth.store";

import type { SelfProfileFormData } from "../../features/validation/employee.schema";

function MyProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<Partial<SelfProfileFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id);
    }
  }, [user?.id]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const data = await getMyProfile(userId);
      if (data) {
        setProfile({
          phone: data.phone || "",
          department: data.department || "",
          designation: data.designation || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          pincode: data.pincode || "",
          bankName: data.bankName || "",
          bankAccountNumber: data.bankAccountNumber || "",
          ifscCode: data.ifscCode || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactPhone: data.emergencyContactPhone || "",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: SelfProfileFormData) => {
    setServerErrors({});
    try {
      setSubmitting(true);
      await updateSelfProfile(values);
      toast.success("Profile updated successfully.");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ?? "Failed to update profile."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading profile details...</p>
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
              onClick={() => navigate("/dashboard")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Profile
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Update your personal and employment information.
              </p>
            </div>
          </div>

          <div className="w-full">
            <MyProfileForm
              defaultValues={profile}
              loading={submitting}
              onSubmit={handleSubmit}
              serverErrors={serverErrors}
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default MyProfilePage;
