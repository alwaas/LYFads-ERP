import { useEffect } from "react";
import { useForm } from "react-hook-form";

export type ProjectFormData = {
  projectCode: string;
  name: string;
  description?: string;
  clientId: string;
  managerId?: string;
  status: string;
  priority: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
};

type Props = {
  loading: boolean;
  onSubmit: (data: ProjectFormData) => void;
  clients: any[];
  employees: any[];
  initialValues?: Partial<ProjectFormData>;
};

function ProjectForm({
  loading,
  onSubmit,
  clients,
  employees,
  initialValues,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
  } = useForm<ProjectFormData>({
    defaultValues: {
      status: "PLANNING",
      priority: "MEDIUM",
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        status: "PLANNING",
        priority: "MEDIUM",
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Code */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Project Code *
          </label>
          <input
            {...register("projectCode", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter project code"
          />
        </div>

        {/* Project Name */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Project Name *
          </label>
          <input
            {...register("name", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter project name"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter project description"
          />
        </div>

        {/* Client */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Client *
          </label>
          <select
            {...register("clientId", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="">Select Client</option>
            {(clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName || client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Manager */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Project Manager
          </label>
          <select
            {...register("managerId")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="">Select Manager</option>
            {(employees ?? []).map((employee) => (
              <option key={employee.user?.id || employee.id} value={employee.user?.id || employee.id}>
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
            <option value="PLANNING">PLANNING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON HOLD</option>
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

        {/* Budget */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Budget
          </label>
          <input
            type="number"
            step="0.01"
            {...register("budget", { valueAsNumber: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter budget"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Start Date
          </label>
          <input
            type="date"
            {...register("startDate")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            End Date
          </label>
          <input
            type="date"
            {...register("endDate")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? "Saving..." : "Save Project"}
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;