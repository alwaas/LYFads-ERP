import { useEffect, useMemo, useState } from "react";
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
};

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
}: Props) {
  const [employeeId, setEmployeeId] = useState(
    initialData?.employeeId ?? "",
  );

  const [projectId, setProjectId] = useState(
    initialData?.projectId ?? "",
  );

  const [taskId, setTaskId] = useState(
    initialData?.taskId ?? "",
  );

  const [workDate, setWorkDate] = useState(
    dateValue(initialData?.workDate),
  );

  const [startTime, setStartTime] = useState(
    timeValue(initialData?.startTime),
  );

  const [endTime, setEndTime] = useState(
    timeValue(initialData?.endTime),
  );

  const [hours, setHours] = useState(
    initialData?.hours !== undefined
      ? String(initialData.hours)
      : "",
  );

  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );

  const [error, setError] = useState("");

  const filteredTasks = useMemo(() => {
    if (!projectId) return tasks;

    return tasks.filter(
      (task) => task.projectId === projectId,
    );
  }, [tasks, projectId]);

  useEffect(() => {
    if (
      taskId &&
      projectId &&
      !filteredTasks.some(
        (task) => task.id === taskId,
      )
    ) {
      setTaskId("");
    }
  }, [filteredTasks, projectId, taskId]);

  const updateStartTime = (value: string) => {
    setStartTime(value);

    const calculated = calculateHours(
      value,
      endTime,
    );

    if (calculated) setHours(calculated);
  };

  const updateEndTime = (value: string) => {
    setEndTime(value);

    const calculated = calculateHours(
      startTime,
      value,
    );

    if (calculated) setHours(calculated);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!workDate) {
      setError("Please select a work date.");
      return;
    }

    if (!hours || Number(hours) <= 0) {
      setError("Please enter valid working hours.");
      return;
    }

    const payload: CreateTimesheetPayload = {
      employeeId,
      workDate,
      hours: String(hours),
    };

    if (projectId) payload.projectId = projectId;
    if (taskId) payload.taskId = taskId;

    if (startTime) {
      payload.startTime =
        `${workDate}T${startTime}:00`;
    }

    if (endTime) {
      payload.endTime =
        `${workDate}T${endTime}:00`;
    }

    if (description.trim()) {
      payload.description = description.trim();
    }

    try {
      await onSubmit(payload);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save timesheet.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Employee *
          </label>

          <select
            required
            value={employeeId}
            disabled={loading}
            onChange={(e) =>
              setEmployeeId(e.target.value)
            }
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
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Work Date *
          </label>

          <input
            required
            type="date"
            value={workDate}
            disabled={loading}
            onChange={(e) =>
              setWorkDate(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Project
          </label>

          <select
            value={projectId}
            disabled={loading}
            onChange={(e) =>
              setProjectId(e.target.value)
            }
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
            value={taskId}
            disabled={!projectId || loading}
            onChange={(e) =>
              setTaskId(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">
              {projectId
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
            value={startTime}
            disabled={loading}
            onChange={(e) =>
              updateStartTime(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            End Time
          </label>

          <input
            type="time"
            value={endTime}
            disabled={loading}
            onChange={(e) =>
              updateEndTime(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Hours *
          </label>

          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={hours}
            disabled={loading}
            placeholder="8.5"
            onChange={(e) =>
              setHours(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description
        </label>

        <textarea
          rows={4}
          value={description}
          disabled={loading}
          placeholder="Describe the work completed..."
          onChange={(e) =>
            setDescription(e.target.value)
          }
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
