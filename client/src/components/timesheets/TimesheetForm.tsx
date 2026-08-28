import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createTimesheetSchema, editTimesheetSchema, type CreateTimesheetFormData, type EditTimesheetFormData } from "../../features/validation/timesheet.schema";

import type { Employee } from "../../types/employee";
import type { Project } from "../../types/project";
import type { Task } from "../../types/task";
import type { CreateTimesheetPayload } from "../../types/timesheet";

type Props = {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  initialData?: Partial<CreateTimesheetPayload>;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (data: CreateTimesheetPayload) => Promise<unknown>;
  serverErrors?: Record<string, string>;
};

type FormData = CreateTimesheetFormData | EditTimesheetFormData;

const dateValue = (value?: string) =>
  value ? value.slice(0, 10) : "";

const timeValue = (value?: string) =>
  value ? value.slice(0, 5) : "";

const calculateHours = (
  start: string,
  end: string,
) => {
  if (!start || !end) return "";

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (endMinutes <= startMinutes) return "";

  return ((endMinutes - startMinutes) / 60).toFixed(2);
};

export default function TimesheetForm({
  employees,
  projects,
  tasks,
  initialData,
  loading = false,
  submitLabel = "Save Timesheet",
  onSubmit,
  serverErrors,
}: Props) {
  const schema = initialData ? editTimesheetSchema : createTimesheetSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      employeeId: initialData?.employeeId ?? "",
      projectId: initialData?.projectId ?? "",
      taskId: initialData?.taskId ?? "",
      workDate: dateValue(initialData?.workDate),
      startTime: timeValue(initialData?.startTime),
      endTime: timeValue(initialData?.endTime),
      hours: initialData?.hours ? Number(initialData.hours) : undefined,
      description: initialData?.description ?? "",
    } as any,
  });

  const watchedProjectId = watch("projectId");
  const watchedStartTime = watch("startTime");
  const watchedEndTime = watch("endTime");

  const filteredTasks = useMemo(() => {
    if (!watchedProjectId) return tasks;

    return tasks.filter(
      (task) => task.projectId === watchedProjectId,
    );
  }, [tasks, watchedProjectId]);

  useEffect(() => {
    const taskId = watch("taskId");
    if (
      taskId &&
      watchedProjectId &&
      !filteredTasks.some(
        (task) => task.id === taskId,
      )
    ) {
      reset({ ...watch(), taskId: "" } as any);
    }
  }, [filteredTasks, watchedProjectId, watch, reset]);

  useEffect(() => {
    if (watchedStartTime && watchedEndTime) {
      const calculated = calculateHours(
        watchedStartTime,
        watchedEndTime,
      );
      if (calculated) {
        reset({ ...watch(), hours: Number(calculated) } as any);
      }
    }
  }, [watchedStartTime, watchedEndTime, reset, watch]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = async (data: FormData) => {
    const payload: CreateTimesheetPayload = {
      employeeId: data.employeeId || "",
      workDate: data.workDate || "",
      hours: String(data.hours ?? 0),
    };

    if (data.projectId) payload.projectId = data.projectId;
    if (data.taskId) payload.taskId = data.taskId;

    if (data.startTime) {
      payload.startTime = `${data.workDate}T${data.startTime}:00`;
    }

    if (data.endTime) {
      payload.endTime = `${data.workDate}T${data.endTime}:00`;
    }

    if (data.description?.trim()) {
      payload.description = data.description.trim();
    }

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      {errors.root && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Employee *
          </label>

          <select
            {...register("employeeId")}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">
              Select Employee
            </option>

            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.user.fullName} (
                {employee.employeeCode})
              </option>
            ))}
          </select>
          {errors.employeeId && (
            <p className="mt-1 text-xs text-red-600">{errors.employeeId.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Work Date *
          </label>

          <input
            type="date"
            {...register("workDate")}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.workDate && (
            <p className="mt-1 text-xs text-red-600">{errors.workDate.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Project
          </label>

          <select
            {...register("projectId")}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">
              Select Project
            </option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Task
          </label>

          <select
            {...register("taskId")}
            disabled={!watchedProjectId || loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">
              {watchedProjectId
                ? "Select Task"
                : "Select Project First"}
            </option>

            {filteredTasks.map((task) => (
              <option
                key={task.id}
                value={task.id}
              >
                {task.taskCode} - {task.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Start Time
          </label>

          <input
            type="time"
            {...register("startTime")}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            End Time
          </label>

          <input
            type="time"
            {...register("endTime")}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.endTime && (
            <p className="mt-1 text-xs text-red-600">{errors.endTime.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Hours *
          </label>

          <input
            type="number"
            step="0.01"
            {...register("hours", { valueAsNumber: true })}
            disabled={loading}
            placeholder="8.5"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.hours && (
            <p className="mt-1 text-xs text-red-600">{errors.hours.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description
        </label>

        <textarea
          rows={4}
          {...register("description")}
          disabled={loading}
          placeholder="Describe the work completed..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
