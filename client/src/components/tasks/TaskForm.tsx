import { useForm } from "react-hook-form";
import { useEffect } from "react";


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
  actualHours?: number;
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
      status: "TODO",
      priority: "MEDIUM",
    },
  });

  useEffect(() => {
    if (initialData) {
        reset(initialData);
    }
    }, [initialData, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl shadow p-6 space-y-6"
    >
      {/* Task Code */}
      <div>
        <label className="block mb-1 font-medium">
          Task Code
        </label>

        <input
          {...register("taskCode", {
            required: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Task Title */}
      <div>
        <label className="block mb-1 font-medium">
          Task Title
        </label>

        <input
          {...register("title", {
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
          rows={4}
          {...register("description")}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Project */}
      <div>
        <label className="block mb-1 font-medium">
          Project
        </label>

        <select
          {...register("projectId", {
            required: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="">
            Select Project
          </option>

          {(projects ?? []).map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Employee */}
      <div>
        <label className="block mb-1 font-medium">
          Employee
        </label>

        <select
          {...register("employeeId")}
          className="w-full border rounded-lg px-4 py-2"
        >
          <option value="">
            Select Employee
          </option>

          {(employees ?? []).map((employee) => (
            <option
              key={employee.id}
              value={employee.id}
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
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">
            IN PROGRESS
          </option>
          <option value="REVIEW">
            REVIEW
          </option>
          <option value="COMPLETED">
            COMPLETED
          </option>
          <option value="CANCELLED">
            CANCELLED
          </option>
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

      {/* Due Date */}
      <div>
        <label className="block mb-1 font-medium">
          Due Date
        </label>

        <input
          type="date"
          {...register("dueDate")}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Estimated Hours */}
      <div>
        <label className="block mb-1 font-medium">
          Estimated Hours
        </label>

        <input
          type="number"
          step="0.5"
          {...register("estimatedHours", {
            valueAsNumber: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Actual Hours
      <div>
        <label className="block mb-1 font-medium">
          Actual Hours
        </label>

        <input
          type="number"
          step="0.5"
          {...register("actualHours", {
            valueAsNumber: true,
          })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div> */}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Task"}
      </button>
    </form>
  );
}

export default TaskForm;