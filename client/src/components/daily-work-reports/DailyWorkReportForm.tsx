import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createDailyWorkReportSchema, editDailyWorkReportSchema, type CreateDailyWorkReportFormData, type EditDailyWorkReportFormData } from "../../features/validation/daily-work-report.schema";

import type {
  CreateDailyWorkReportDto,
  DailyWorkReport,
} from "../../types/daily-work-report";

type Employee = {
  id: string;
  employeeCode: string;
  user: {
    fullName: string;
  };
};

type Project = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  projectId: string;
};

type Props = {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  loading?: boolean;
  initialData?: DailyWorkReport;
  onSubmit: (data: CreateDailyWorkReportDto) => void;
  serverErrors?: Record<string, string>;
};

type FormData = CreateDailyWorkReportFormData | EditDailyWorkReportFormData;

function DailyWorkReportForm({
  employees,
  projects,
  tasks,
  loading = false,
  initialData,
  onSubmit,
  serverErrors,
}: Props) {
  const schema = initialData ? editDailyWorkReportSchema : createDailyWorkReportSchema;

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
      employeeId: "",
      projectId: "",
      taskId: "",
      reportDate: "",
      yesterdayWork: "",
      todayWork: "",
      tomorrowPlan: "",
      hoursWorked: 8,
      status: "COMPLETED",
      managerRemarks: "",
    },
  });

  const watchedProjectId = watch("projectId");

  const filteredTasks = useMemo(() => {
    if (!watchedProjectId) {
      return tasks;
    }

    return tasks.filter(
      (task) => task.projectId === watchedProjectId,
    );
  }, [tasks, watchedProjectId]);

  useEffect(() => {
    if (!initialData) return;

    reset({
      employeeId: initialData.employeeId,
      projectId: initialData.projectId ?? "",
      taskId: initialData.taskId ?? "",
      reportDate: initialData.reportDate.split("T")[0],
      yesterdayWork: initialData.yesterdayWork ?? "",
      todayWork: initialData.todayWork,
      tomorrowPlan: initialData.tomorrowPlan ?? "",
      hoursWorked: Number(initialData.hoursWorked),
      status: initialData.status as FormData["status"],
      managerRemarks: initialData.managerRemarks ?? "",
    });
  }, [initialData, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as unknown as CreateDailyWorkReportDto);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
    >
      {/* Employee */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Employee
        </label>

        <select
          {...register("employeeId")}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">Select Employee</option>

          {Array.isArray(employees) &&
            employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.employeeCode} - {employee.user.fullName}
              </option>
            ))}
        </select>
        {errors.employeeId && (
          <p className="mt-1 text-xs text-red-600">{errors.employeeId.message}</p>
        )}
      </div>

      {/* Project + Task */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Project */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Project
          </label>

          <select
            {...register("projectId")}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select Project</option>

            {Array.isArray(projects) &&
              projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>

        {/* Task */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Task
          </label>

          <select
            {...register("taskId")}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select Task</option>

            {filteredTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date + Hours + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Report Date */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Report Date
          </label>

          <input
            type="date"
            {...register("reportDate")}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {errors.reportDate && (
            <p className="mt-1 text-xs text-red-600">{errors.reportDate.message}</p>
          )}
        </div>

        {/* Hours Worked */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Hours Worked
          </label>

          <input
            type="number"
            step="0.01"
            {...register("hoursWorked", { valueAsNumber: true })}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <p className="mt-1 text-xs text-slate-500">
            Enter a value between 0 and 24 hours.
          </p>
          {errors.hoursWorked && (
            <p className="mt-1 text-xs text-red-600">{errors.hoursWorked.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Status
          </label>

          <select
            {...register("status")}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
          )}
        </div>
      </div>

      {/* Yesterday Work */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Yesterday Work
        </label>

        <textarea
          rows={3}
          {...register("yesterdayWork")}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What did you complete yesterday?"
          disabled={loading}
        />
      </div>

      {/* Today Work */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Today Work
        </label>

        <textarea
          rows={4}
          {...register("todayWork")}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What did you work on today?"
          disabled={loading}
        />
        {errors.todayWork && (
          <p className="mt-1 text-xs text-red-600">{errors.todayWork.message}</p>
        )}
      </div>

      {/* Tomorrow Plan */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Tomorrow Plan
        </label>

        <textarea
          rows={3}
          {...register("tomorrowPlan")}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What do you plan to work on tomorrow?"
          disabled={loading}
        />
      </div>

      {/* Manager Remarks */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Manager Remarks
        </label>

        <textarea
          rows={3}
          {...register("managerRemarks")}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Manager remarks"
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Saving..." : "Save Daily Work Report"}
        </button>
      </div>
    </form>
  );
}

export default DailyWorkReportForm;
