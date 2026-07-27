import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import TaskForm, {
  type TaskFormData,
} from "../../components/tasks/TaskForm";

import { createTask } from "../../services/task.service";
import { getProjects } from "../../services/project.service";
import { getEmployees } from "../../services/employee.service";

function AddTaskPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, employeesData] =
        await Promise.all([
          getProjects(),
          getEmployees(),
        ]);

      setProjects(projectsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (
    data: TaskFormData
  ) => {
    try {
      setLoading(true);

      await createTask(data);

      toast.success(
        "Task created successfully."
      );

      navigate("/tasks");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ??
          "Failed to create task."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Add Task
        </h1>

        <TaskForm
          loading={loading}
          onSubmit={handleSubmit}
          projects={projects}
          employees={employees}
        />

      </div>

    </DashboardLayout>
  );
}

export default AddTaskPage;