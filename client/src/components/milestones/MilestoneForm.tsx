import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createMilestoneSchema, editMilestoneSchema, type CreateMilestoneFormData, type EditMilestoneFormData } from "../../features/validation/milestone.schema";

export type MilestoneFormData = {
  title: string;
  description?: string;
  projectId: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  deadline: string;
};

type Project = {
  id: string;
  projectCode?: string;
  name: string;
};

type Props = {
  loading: boolean;
  projects: Project[];
  onSubmit: (data: MilestoneFormData) => void;
  initialValues?: Partial<MilestoneFormData>;
  serverErrors?: Record<string, string>;
};

type FormData = CreateMilestoneFormData | EditMilestoneFormData;

function MilestoneForm({
  loading,
  projects,
  onSubmit,
  initialValues,
  serverErrors,
}: Props) {
  const schema = initialValues ? editMilestoneSchema : createMilestoneSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      progress: 0,
      startDate: "",
      deadline: "",
      ...initialValues,
    } as any,
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        title: "",
        description: "",
        projectId: "",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        progress: 0,
        startDate: "",
        deadline: "",
        ...initialValues,
      } as any);
    }
  }, [initialValues, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as unknown as MilestoneFormData);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Milestone Title *
          </label>

          <input
            {...register("title")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Enter milestone title"
          />

          {errors.title && (
            <p className="mt-1 text-sm text-red-600">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Description
          </label>

          <textarea
            {...register("description")}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Enter milestone description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Project */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Project *
          </label>

          <select
            {...register("projectId")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select Project</option>

            {(projects ?? []).map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.projectCode
                  ? `${project.projectCode} - ${project.name}`
                  : project.name}
              </option>
            ))}
          </select>

          {errors.projectId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.projectId.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Status
          </label>

          <select
            {...register("status")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="NOT_STARTED">
              NOT STARTED
            </option>

            <option value="IN_PROGRESS">
              IN PROGRESS
            </option>

            <option value="COMPLETED">
              COMPLETED
            </option>

            <option value="ON_HOLD">
              ON HOLD
            </option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">
              {errors.status.message}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Priority
          </label>

          <select
            {...register("priority")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">
              {errors.priority.message}
            </p>
          )}
        </div>

        {/* Progress */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Progress (%)
          </label>

          <input
            type="number"
            min={0}
            max={100}
            {...register("progress", {
              valueAsNumber: true,
            })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="0"
          />

          {errors.progress && (
            <p className="mt-1 text-sm text-red-600">
              {errors.progress.message}
            </p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Start Date *
          </label>

          <input
            type="date"
            {...register("startDate")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.startDate.message}
            </p>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Deadline *
          </label>

          <input
            type="date"
            {...register("deadline")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          {errors.deadline && (
            <p className="mt-1 text-sm text-red-600">
              {errors.deadline.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : initialValues
              ? "Update Milestone"
              : "Create Milestone"}
        </button>
      </div>
    </form>
  );
}

export default MilestoneForm;
