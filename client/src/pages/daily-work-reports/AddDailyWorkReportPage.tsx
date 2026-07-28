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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeeData, projectData, taskData] =
        await Promise.all([
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
    }
  };

  const handleSubmit = async (
    data: CreateDailyWorkReportDto
  ) => {
    try {
      setLoading(true);

      await createDailyWorkReport(data);

      toast.success(
        "Daily Work Report created successfully."
      );

      navigate("/daily-work-reports");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ??
          "Failed to create report."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Add Daily Work Report
        </h1>

        <DailyWorkReportForm
          employees={employees}
          projects={projects}
          tasks={tasks}
          loading={loading}
          onSubmit={handleSubmit}
        />

      </div>
    </DashboardLayout>
  );
}

export default AddDailyWorkReportPage;