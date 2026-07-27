import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import TaskForm, {
  type TaskFormData,
} from "../../components/tasks/TaskForm";

import {
  getTask,
  updateTask,
} from "../../services/task.service";

import { getProjects } from "../../services/project.service";
import { getEmployees } from "../../services/employee.service";

function EditTaskPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [initialData, setInitialData] =
    useState<TaskFormData | null>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (taskId: string) => {
    try {
      const [
        task,
        projectList,
        employeeList,
      ] = await Promise.all([
        getTask(taskId),
        getProjects(),
        getEmployees(),
      ]);

      setProjects(projectList);
      setEmployees(employeeList);

      setInitialData({
        taskCode: task.taskCode,
        title: task.title,
        description: task.description ?? "",
        projectId: task.projectId,
        employeeId: task.employeeId ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
          ? task.dueDate.substring(0, 10)
          : "",
        estimatedHours: task.estimatedHours,
      });

    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to load task."
      );
    }
  };

  const handleSubmit = async (
    data: TaskFormData
  ) => {
    try {
      setLoading(true);

      await updateTask(id!, data);

      toast.success(
        "Task updated successfully."
      );

      navigate("/tasks");

    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ??
          "Failed to update task."
      );

    } finally {
      setLoading(false);
    }
  };

  if (!initialData) {
    return (
      <DashboardLayout>
        Loading...
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Edit Task
        </h1>

        <TaskForm
          loading={loading}
          onSubmit={handleSubmit}
          initialData={initialData}
          projects={projects}
          employees={employees}
        />

      </div>

    </DashboardLayout>
  );
}

export default EditTaskPage;