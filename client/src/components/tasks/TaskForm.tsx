import { useEffect } from "react";
import { useForm } from "react-hook-form";

export type TaskFormData = {
  taskCode: string;
  title: string;
  description?: string;
  projectId: string;
  employeeId?: string;
  status: string;
  priority: string;
  dueDate?: string;
  estimatedHours?: number;
  // actualHours?: number;
};

type Props = {
  loading: boolean;
  onSubmit: (data: TaskFormData) => void;
  initialData?: TaskFormData;
  projects: any[];
  employees: any[];
};

function TaskForm({
  loading,
  onSubmit,
  initialData,
  projects,
  employees,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
  } = useForm<TaskFormData>({
    defaultValues: {
      taskCode: "",
      title: "",
      description: "",
      projectId: "",
      employeeId: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      estimatedHours: undefined,
    },
  });

  useEffect(() => {
    if (!initialData) return;

    reset({
      taskCode: initialData.taskCode || "",
      title: initialData.title || "",
      description: initialData.description || "",
      projectId: initialData.projectId || "",
      employeeId: initialData.employeeId || "",
      status: initialData.status || "TODO",
      priority: initialData.priority || "MEDIUM",
      dueDate: initialData.dueDate || "",
      estimatedHours: initialData.estimatedHours,
    });
  }, [initialData, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Code */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Task Code *
          </label>
          <input
            {...register("taskCode", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter task code"
          />
        </div>

        {/* Task Title */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Task Title *
          </label>
          <input
            {...register("title", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter task title"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Description
          </label>
          <textarea
            rows={3}
            {...register("description")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter task description"
          />
        </div>

        {/* Project */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Project *
          </label>
          <select
            {...register("projectId", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="">Select Project</option>
            {(projects ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employee */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Assigned Employee
          </label>
          <select
            {...register("employeeId")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="">Select Employee</option>
            {(employees ?? []).map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.user?.fullName || employee.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            {...register("status")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Priority
          </label>
          <select
            {...register("priority")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Due Date
          </label>
          <input
            type="date"
            {...register("dueDate")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
          />
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Estimated Hours
          </label>
          <input
            type="number"
            step="0.5"
            {...register("estimatedHours", { valueAsNumber: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="e.g. 8"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? "Saving..." : "Save Task"}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;