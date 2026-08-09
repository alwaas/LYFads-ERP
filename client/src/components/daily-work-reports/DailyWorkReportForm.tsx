import { useEffect, useMemo, useState } from "react";

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
  projectId: string;
};

type Props = {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  loading?: boolean;
  initialData?: DailyWorkReport;
  onSubmit: (data: CreateDailyWorkReportDto) => void;
};

function DailyWorkReportForm({
  employees,
  projects,
  tasks,
  loading = false,
  initialData,
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
      employeeId: initialData.employeeId,
      projectId: initialData.projectId ?? "",
      taskId: initialData.taskId ?? "",
      reportDate: initialData.reportDate.split("T")[0],
      yesterdayWork: initialData.yesterdayWork ?? "",
      todayWork: initialData.todayWork,
      tomorrowPlan: initialData.tomorrowPlan ?? "",
      hoursWorked: Number(initialData.hoursWorked),
      status: initialData.status,
      managerRemarks: initialData.managerRemarks ?? "",
    });
  }, [initialData]);

  const filteredTasks = useMemo(() => {
    if (!formData.projectId) {
      return tasks;
    }

    return tasks.filter(
      (task) => task.projectId === formData.projectId,
    );
  }, [formData.projectId, tasks]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => {
      if (name === "projectId") {
        return {
          ...previous,
          projectId: value,
          taskId:
            previous.taskId &&
            !tasks.some(
              (task) =>
                task.id === previous.taskId &&
                task.projectId === value,
            )
              ? ""
              : previous.taskId,
        };
      }

      return {
        ...previous,
        [name]:
          name === "hoursWorked"
            ? value === ""
              ? 0
              : Number(value)
            : value,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const hours = Number(formData.hoursWorked);

    if (!Number.isFinite(hours)) {
      return;
    }

    if (hours < 0 || hours > 24) {
      return;
    }

    if (!formData.employeeId) {
      return;
    }

    if (!formData.reportDate) {
      return;
    }

    if (!formData.todayWork.trim()) {
      return;
    }

    const payload: CreateDailyWorkReportDto = {
      employeeId: formData.employeeId,
      projectId: formData.projectId || undefined,
      taskId: formData.taskId || undefined,
      reportDate: formData.reportDate,
      yesterdayWork: formData.yesterdayWork || undefined,
      todayWork: formData.todayWork.trim(),
      tomorrowPlan: formData.tomorrowPlan || undefined,
      hoursWorked: hours,
      status: formData.status,
      managerRemarks: formData.managerRemarks || undefined,
    };

    onSubmit(payload);
  };

  const renderTaskOptions = () => {
    if (!Array.isArray(filteredTasks) || filteredTasks.length === 0) {
      return <option value="">No matching tasks</option>;
    }

    return filteredTasks.map((task) => (
      <option key={task.id} value={task.id}>
        {task.title}
      </option>
    ));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
    >
      {/* Employee */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Employee
        </label>

        <select
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Employee</option>

          {Array.isArray(employees) &&
            employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.employeeCode} - {employee.user.fullName}
              </option>
            ))}
        </select>
      </div>

      {/* Project + Task */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Project */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Project
          </label>

          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            name="taskId"
            value={formData.taskId}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Task</option>

            {renderTaskOptions()}
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
            name="reportDate"
            value={formData.reportDate}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Hours Worked */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Hours Worked
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            max="24"
            name="hoursWorked"
            value={formData.hoursWorked}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <p className="mt-1 text-xs text-slate-500">
            Enter a value between 0 and 24 hours.
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block mb-2 font-medium text-slate-700">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Yesterday Work */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Yesterday Work
        </label>

        <textarea
          rows={3}
          name="yesterdayWork"
          value={formData.yesterdayWork}
          onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What did you complete yesterday?"
        />
      </div>

      {/* Today Work */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Today Work
        </label>

        <textarea
          rows={4}
          name="todayWork"
          value={formData.todayWork}
          onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What did you work on today?"
          required
        />
      </div>

      {/* Tomorrow Plan */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Tomorrow Plan
        </label>

        <textarea
          rows={3}
          name="tomorrowPlan"
          value={formData.tomorrowPlan}
          onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What do you plan to work on tomorrow?"
        />
      </div>

      {/* Manager Remarks */}
      <div>
        <label className="block mb-2 font-medium text-slate-700">
          Manager Remarks
        </label>

        <textarea
          rows={3}
          name="managerRemarks"
          value={formData.managerRemarks}
          onChange={handleChange}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Manager remarks"
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