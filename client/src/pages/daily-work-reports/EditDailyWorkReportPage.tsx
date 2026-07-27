import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import DailyWorkReportForm from "../../components/daily-work-reports/DailyWorkReportForm";

import {
  getDailyWorkReportById,
  updateDailyWorkReport,
} from "../../services/daily-work-report.service";

import { getEmployees } from "../../services/employee.service";
import { getProjects } from "../../services/project.service";
import { getTasks } from "../../services/task.service";

function EditDailyWorkReportPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [report, setReport] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        employeeData,
        projectData,
        taskData,
        reportData,
      ] = await Promise.all([
        getEmployees(),
        getProjects(),
        getTasks(),
        getDailyWorkReportById(id!),
      ]);

      setEmployees(employeeData);
      setProjects(projectData);
      setTasks(taskData);
      setReport(reportData);
    } catch {
      toast.error("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await updateDailyWorkReport(id!, data);

      toast.success("Report Updated");

      navigate("/daily-work-reports");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          "Update failed"
      );
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        Loading...
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Edit Daily Work Report
      </h1>

      <DailyWorkReportForm
        initialData={report}
        employees={employees}
        projects={projects}
        tasks={tasks}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}

export default EditDailyWorkReportPage;