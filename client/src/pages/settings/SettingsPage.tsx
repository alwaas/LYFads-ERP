import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getSettings, updateSettings } from "../../services/settings.service";
import { updateSettingsSchema, type UpdateSettingsFormData } from "../../features/validation/settings.schema";
import { mapServerValidationErrors } from "../../features/validation/errors";

function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateSettingsFormData>({
    resolver: zodResolver(updateSettingsSchema),
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      reset({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        logo: data.logo || "",
        timezone: data.timezone || "UTC",
        currency: data.currency || "USD",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: UpdateSettingsFormData) => {
    setServerErrors({});
    try {
      setSubmitting(true);
      const payload = {
        ...(values.name && { name: values.name }),
        ...(values.email && { email: values.email }),
        ...(values.phone && { phone: values.phone }),
        ...(values.address && { address: values.address }),
        ...(values.logo && { logo: values.logo }),
        ...(values.timezone && { timezone: values.timezone }),
        ...(values.currency && { currency: values.currency }),
      };
      await updateSettings(payload);
      toast.success("Settings updated successfully.");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error((error as any)?.response?.data?.message ?? "Failed to update settings.");
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
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading settings...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8">
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Settings
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage your company profile and preferences.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="Enter company name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="company@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="+1 234 567 8900"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    {...register("logo")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="https://example.com/logo.png"
                  />
                  {errors.logo && (
                    <p className="mt-1 text-xs text-red-500">{errors.logo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    {...register("timezone")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="UTC"
                  />
                  {errors.timezone && (
                    <p className="mt-1 text-xs text-red-500">{errors.timezone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    {...register("currency")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="USD"
                  />
                  {errors.currency && (
                    <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="Enter company address"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>

              {Object.keys(serverErrors).length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3">
                  {Object.values(serverErrors).map((err, idx) => (
                    <p key={idx} className="text-sm">{err}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !isDirty}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default SettingsPage;
