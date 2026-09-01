import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, X } from "lucide-react";
import { z } from "zod";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { createPlan } from "../../services/plan.service";

const createPlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, hyphens"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be 0 or greater"),
  billingInterval: z.enum(["MONTHLY", "YEARLY"]),
  isActive: z.boolean().optional().default(true),
  features: z
    .array(
      z.object({
        featureCode: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  limits: z
    .array(
      z.object({
        resourceCode: z.string().min(1),
        limitValue: z.number(),
      }),
    )
    .optional()
    .default([]),
});

type CreatePlanFormData = z.input<typeof createPlanSchema>;

function AddPlanPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePlanFormData>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      billingInterval: "MONTHLY",
      isActive: true,
      features: [],
      limits: [],
    },
  });

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({ control, name: "features" });

  const {
    fields: limitFields,
    append: appendLimit,
    remove: removeLimit,
  } = useFieldArray({ control, name: "limits" });

  const onSubmit = async (values: CreatePlanFormData) => {
    try {
      setSubmitting(true);
      await createPlan({
        name: values.name,
        code: values.code,
        description: values.description,
        price: values.price,
        billingInterval: values.billingInterval,
        isActive: values.isActive,
        features: (values.features || []).filter((f) => f.featureCode),
        limits: (values.limits || []).filter((l) => l.resourceCode),
      });
      toast.success("Plan created successfully.");
      navigate("/plans");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create plan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/plans")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Create Plan
              </h1>
              <p className="text-sm text-slate-500">
                Define a new SaaS plan with features and limits.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Plan Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    {...register("name")}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Professional"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Code *
                  </label>
                  <input
                    {...register("code")}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="PRO"
                  />
                  {errors.code && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price *
                  </label>
                <input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="29.99"
                />
                  {errors.price && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Billing Interval
                  </label>
                  <select
                    {...register("billingInterval")}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Describe this plan..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register("isActive")}
                  type="checkbox"
                  id="isActive"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Active (available for assignment)
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Features
                </h2>
                <button
                  type="button"
                  onClick={() => appendFeature({ featureCode: "", description: "" })}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                  <Plus size={14} /> Add Feature
                </button>
              </div>

              {featureFields.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No features added. Features represent what is included in this
                  plan.
                </p>
              ) : (
                <div className="space-y-3">
                  {featureFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3"
                    >
                      <input
                        {...register(`features.${index}.featureCode`)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Feature code (e.g., PAYROLL)"
                      />
                      <input
                        {...register(`features.${index}.description`)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Description"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Limits
                </h2>
                <button
                  type="button"
                  onClick={() => appendLimit({ resourceCode: "", limitValue: -1 })}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                  <Plus size={14} /> Add Limit
                </button>
              </div>

              {limitFields.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No limits added. Use -1 for unlimited.
                </p>
              ) : (
                <div className="space-y-3">
                  {limitFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3"
                    >
                      <input
                        {...register(`limits.${index}.resourceCode`)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Resource code (e.g., MAX_USERS)"
                      />
                      <input
                        {...register(`limits.${index}.limitValue`, { valueAsNumber: true })}
                        type="number"
                        className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeLimit(index)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? "Creating..." : "Create Plan"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/plans")}
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

export default AddPlanPage;
