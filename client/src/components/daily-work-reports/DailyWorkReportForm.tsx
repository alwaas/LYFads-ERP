import { useEffect, useState } from "react";

import type {
  CreateDailyWorkReportDto,
  WorkStatus,
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
};

type Props = {
  initialData?: Partial<CreateDailyWorkReportDto>;

  employees: Employee[];

  projects: Project[];

  tasks: Task[];

  loading?: boolean;

  onSubmit: (data: CreateDailyWorkReportDto) => void;
};

type FormData = {
  employeeId: string;
  projectId: string;
  taskId: string;
  reportDate: string;
  yesterdayWork: string;
  todayWork: string;
  tomorrowPlan: string;
  hoursWorked: number;
  status: WorkStatus;
  managerRemarks: string;
};

function DailyWorkReportForm({
  initialData,
  employees,
  projects,
  tasks,
  loading = false,
  onSubmit,
}: Props) {
  const [formData, setFormData] = useState<FormData>({
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
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setFormData({
      employeeId: initialData.employeeId ?? "",
      projectId: initialData.projectId ?? "",
      taskId: initialData.taskId ?? "",

      reportDate: initialData.reportDate
        ? initialData.reportDate.split("T")[0]
        : "",

      yesterdayWork: initialData.yesterdayWork ?? "",
      todayWork: initialData.todayWork ?? "",
      tomorrowPlan: initialData.tomorrowPlan ?? "",

      hoursWorked:
        typeof initialData.hoursWorked === "number"
          ? initialData.hoursWorked
          : 8,

      status: initialData.status ?? "COMPLETED",

      managerRemarks: initialData.managerRemarks ?? "",
    });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "hoursWorked") {
      const numericValue = Number(value);

      setFormData((previous) => ({
        ...previous,
        hoursWorked: Number.isFinite(numericValue)
          ? numericValue
          : 0,
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const hoursWorked = Number(formData.hoursWorked);

    if (
      !Number.isFinite(hoursWorked) ||
      hoursWorked < 0 ||
      hoursWorked > 24
    ) {
      return;
    }

    const payload: CreateDailyWorkReportDto = {
      employeeId: formData.employeeId,

      projectId: formData.projectId || undefined,

      taskId: formData.taskId || undefined,

      reportDate: formData.reportDate,

      yesterdayWork: formData.yesterdayWork || undefined,

      todayWork: formData.todayWork,

      tomorrowPlan: formData.tomorrowPlan || undefined,

      hoursWorked,

      status: formData.status,

      managerRemarks: formData.managerRemarks || undefined,
    };

    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6"
    >
      {/* Employee */}
      <div>
        <label className="block mb-2 font-medium">
          Employee
        </label>

        <select
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
          required
        >
          <option value="">
            Select Employee
          </option>

          {Array.isArray(employees) &&
            employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.employeeCode} -{" "}
                {employee.user?.fullName ?? "Unknown Employee"}
              </option>
            ))}
        </select>
      </div>

      {/* Project + Task */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Project */}
        <div>
          <label className="block mb-2 font-medium">
            Project
          </label>

          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="">
              Select Project
            </option>

            {Array.isArray(projects) &&
              projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))}
          </select>
        </div>

        {/* Task */}
        <div>
          <label className="block mb-2 font-medium">
            Task
          </label>

          <select
            name="taskId"
            value={formData.taskId}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="">
              Select Task
            </option>

            {Array.isArray(tasks) &&
              tasks.map((task) => (
                <option
                  key={task.id}
                  value={task.id}
                >
                  {task.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Date + Hours + Status */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Report Date */}
        <div>
          <label className="block mb-2 font-medium">
            Report Date
          </label>

          <input
            type="date"
            name="reportDate"
            value={formData.reportDate}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
            required
          />
        </div>

        {/* Hours Worked */}
        <div>
          <label className="block mb-2 font-medium">
            Hours Worked
          </label>

          <input
            type="number"
            step="0.25"
            min="0"
            max="24"
            name="hoursWorked"
            value={formData.hoursWorked}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
            required
          />

          <p className="text-xs text-slate-500 mt-1">
            Enter hours between 0 and 24.
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block mb-2 font-medium">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="PLANNED">
              Planned
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="BLOCKED">
              Blocked
            </option>
          </select>
        </div>
      </div>

      {/* Yesterday Work */}
      <div>
        <label className="block mb-2 font-medium">
          Yesterday Work
        </label>

        <textarea
          rows={3}
          name="yesterdayWork"
          value={formData.yesterdayWork}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
          placeholder="What was completed yesterday?"
        />
      </div>

      {/* Today Work */}
      <div>
        <label className="block mb-2 font-medium">
          Today Work
        </label>

        <textarea
          rows={4}
          name="todayWork"
          value={formData.todayWork}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
          placeholder="What work was completed today?"
          required
        />
      </div>

      {/* Tomorrow Plan */}
      <div>
        <label className="block mb-2 font-medium">
          Tomorrow Plan
        </label>

        <textarea
          rows={3}
          name="tomorrowPlan"
          value={formData.tomorrowPlan}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
          placeholder="What is planned for tomorrow?"
        />
      </div>

      {/* Manager Remarks */}
      <div>
        <label className="block mb-2 font-medium">
          Manager Remarks
        </label>

        <textarea
          rows={3}
          name="managerRemarks"
          value={formData.managerRemarks}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
          placeholder="Manager remarks..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Saving..."
            : "Save Daily Work Report"}
        </button>
      </div>
    </form>
  );
}

export default DailyWorkReportForm;