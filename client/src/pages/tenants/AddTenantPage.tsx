import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { createTenant } from "../../services/tenant.service";

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  maxUsers: z.number().min(1).optional(),
  maxStorage: z.number().min(1).optional(),
});

type CreateTenantFormData = z.input<typeof createTenantSchema>;

function AddTenantPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      timezone: "UTC",
      currency: "USD",
    },
  });

  const onSubmit = async (values: CreateTenantFormData) => {
    try {
      setSubmitting(true);
      await createTenant({
        name: values.name,
        slug: values.slug,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        timezone: values.timezone || undefined,
        currency: values.currency || undefined,
        maxUsers: values.maxUsers,
        maxStorage: values.maxStorage,
      });
      toast.success("Tenant created successfully.");
      navigate("/tenants");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/tenants")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Create Tenant
              </h1>
              <p className="text-sm text-slate-500">
                Add a new tenant to the platform.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-xl border border-slate-200 bg-white p-6 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tenant Name *
                </label>
                <input
                  {...register("name")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Acme Corporation"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug *
                </label>
                <input
                  {...register("slug")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="acme-corp"
                />
                {errors.slug && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="contact@acme.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  {...register("phone")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Timezone
                </label>
                <input
                  {...register("timezone")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="UTC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Currency
                </label>
                <input
                  {...register("currency")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="USD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Users
                </label>
                <input
                  {...register("maxUsers", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Storage (MB)
                </label>
                <input
                  {...register("maxStorage", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="1024"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              <textarea
                {...register("address")}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="123 Main St, City, Country"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? "Creating..." : "Create Tenant"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/tenants")}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default AddTenantPage;
