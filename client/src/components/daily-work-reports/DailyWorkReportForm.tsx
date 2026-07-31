import { useEffect, useState } from "react";

import type {
  CreateDailyWorkReportDto,
  DailyWorkReport,
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
  initialData?: Partial<DailyWorkReport>;

  employees: Employee[];

  projects: Project[];

  tasks: Task[];

  loading?: boolean;

  onSubmit: (
    data: CreateDailyWorkReportDto
  ) => void;
};

function DailyWorkReportForm({
  initialData,
  employees,
  projects,
  tasks,
  loading = false,
  onSubmit,
}: Props) {
  const [formData, setFormData] = useState({
    employeeId: "",
    projectId: "",
    taskId: "",
    reportDate: "",
    yesterdayWork: "",
    todayWork: "",
    tomorrowPlan: "",
    hoursWorked: 8,
    status: "COMPLETED" as WorkStatus,
    managerRemarks: "",
  });

  useEffect(() => {
    if (!initialData) return;

    setFormData({
      employeeId:
        initialData.employeeId ?? "",

      projectId:
        initialData.projectId ?? "",

      taskId:
        initialData.taskId ?? "",

      reportDate:
        initialData.reportDate?.split("T")[0] ??
        "",

      yesterdayWork:
        initialData.yesterdayWork ?? "",

      todayWork:
        initialData.todayWork ?? "",

      tomorrowPlan:
        initialData.tomorrowPlan ?? "",

      hoursWorked: Number(
        initialData.hoursWorked ?? 8
      ),

      status:
        (initialData.status as WorkStatus) ??
        "COMPLETED",

      managerRemarks:
        initialData.managerRemarks ?? "",
    });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    onSubmit({
      ...formData,
      hoursWorked: Number(
        formData.hoursWorked
      ),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white rounded-xl shadow p-8"
    >
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

          {employees.map((employee) => (
            <option
              key={employee.id}
              value={employee.id}
            >
              {employee.employeeCode} -{" "}
              {employee.user.fullName}
            </option>
          ))}
        </select>

      </div>

      <div className="grid md:grid-cols-2 gap-5">

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

      <div className="grid md:grid-cols-3 gap-5">

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

        </div>

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
        />

      </div>

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
          required
        />

      </div>

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
        />

      </div>

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
        />

      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : "Save Daily Work Report"}
      </button>

    </form>
  );
}

export default DailyWorkReportForm;