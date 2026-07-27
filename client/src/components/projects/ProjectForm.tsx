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
      className="bg-white rounded-xl shadow p-6 space-y-5"
    >
      {/* Project Code */}
      <div>
        <label className="block mb-1 font-medium">
          Project Code
        </label>

        <input
          {...register("projectCode", {
            required: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Project Name */}
      <div>
        <label className="block mb-1 font-medium">
          Project Name
        </label>

        <input
          {...register("name", {
            required: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block mb-1 font-medium">
          Description
        </label>

        <textarea
          {...register("description")}
          rows={4}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Client */}
      <div>
        <label className="block mb-1 font-medium">
          Client
        </label>

        <select
          {...register("clientId", {
            required: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="">Select Client</option>

          {(clients ?? []).map((client) => (
            <option
              key={client.id}
              value={client.id}
            >
              {client.companyName}
            </option>
          ))}
        </select>
      </div>

      {/* Project Manager */}
      <div>
        <label className="block mb-1 font-medium">
          Project Manager
        </label>

        <select
          {...register("managerId")}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="">Select Manager</option>

          {(employees ?? []).map((employee) => (
            <option
              key={employee.user.id}
              value={employee.user.id}
            >
              {employee.user.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block mb-1 font-medium">
          Status
        </label>

        <select
          {...register("status")}
          className="w-full border rounded-lg px-4 py-2"
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
        <label className="block mb-1 font-medium">
          Priority
        </label>

        <select
          {...register("priority")}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="URGENT">URGENT</option>
        </select>
      </div>

      {/* Budget */}
      <div>
        <label className="block mb-1 font-medium">
          Budget
        </label>

        <input
          type="number"
          step="0.01"
          {...register("budget", {
            valueAsNumber: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
          placeholder="Enter project budget"
        />
      </div>

      {/* Start Date */}
      <div>
        <label className="block mb-1 font-medium">
          Start Date
        </label>

        <input
          type="date"
          {...register("startDate")}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block mb-1 font-medium">
          End Date
        </label>

        <input
          type="date"
          {...register("endDate")}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Project"}
      </button>
    </form>
  );
}

export default ProjectForm;