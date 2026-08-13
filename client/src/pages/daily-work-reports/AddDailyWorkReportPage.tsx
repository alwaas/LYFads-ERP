import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import DailyWorkReportForm from "../../components/daily-work-reports/DailyWorkReportForm";

import { createDailyWorkReport } from "../../services/daily-work-report.service";
import { getEmployees } from "../../services/employee.service";
import { getProjects } from "../../services/project.service";
import { getTasks } from "../../services/task.service";

import type { Employee } from "../../types/employee";
import type { Project } from "../../types/project";
import type { Task } from "../../types/task";

import type { CreateDailyWorkReportDto } from "../../types/daily-work-report";

function AddDailyWorkReportPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        employeeData,
        projectData,
        taskData,
      ] = await Promise.all([
        getEmployees(),
        getProjects(),
        getTasks(),
      ]);

      setEmployees(employeeData);
      setProjects(projectData);
      setTasks(taskData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load form data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (
    values: CreateDailyWorkReportDto
  ) => {
    try {
      setSubmitting(true);

      const hours = Number(values.hoursWorked);

      if (
        !Number.isFinite(hours) ||
        hours < 0 ||
        hours > 24
      ) {
        toast.error(
          "Hours Worked must be between 0 and 24."
        );
        return;
      }

      const payload: CreateDailyWorkReportDto = {
        employeeId: values.employeeId,
        
        projectId:
        values.projectId || undefined,
        
        taskId:
        values.taskId || undefined,
        
        reportDate: values.reportDate,
        
        hoursWorked: values.hoursWorked,

        yesterdayWork:
          values.yesterdayWork || undefined,

        todayWork: values.todayWork,

        tomorrowPlan:
          values.tomorrowPlan || undefined,


        status: values.status,

        managerRemarks:
          values.managerRemarks || undefined,
      };

      await createDailyWorkReport(payload);

      toast.success(
        "Daily work report added successfully."
      );

      navigate("/daily-work-reports");
    } catch (error: unknown) {
      console.error(error);

      const message =
        typeof error === "object" && error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        (error as any).response !== null
          ? (error as any).response.data?.message
          : undefined;

      toast.error(
        Array.isArray(message)
          ? message[0]
          : message ??
              "Failed to create daily work report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Add Daily Work Report
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Submit your daily work progress and hours.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 animate-pulse">
              Loading form data...
            </p>
          </div>
        ) : (
          <DailyWorkReportForm
            employees={employees}
            projects={projects}
            tasks={tasks}
            loading={submitting}
            onSubmit={handleSubmit}
          />
        )}

      </div>
    </DashboardLayout>
  );
}

export default AddDailyWorkReportPage;