import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import TaskForm, { type TaskFormData } from "../../components/tasks/TaskForm";
import { getTask, updateTask } from "../../services/task.service";
import { getProjects } from "../../services/project.service";
import { getEmployees } from "../../services/employee.service";

function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskFormData | undefined>(undefined);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadTask(id);
    getProjects().then(setProjects).catch(() => {});
    getEmployees().then(setEmployees).catch(() => {});
  }, [id]);

  const loadTask = async (taskId: string) => {
    try {
      setLoading(true);

      const data = await getTask(taskId);

      const taskData: TaskFormData = {
        taskCode: data?.taskCode || "",
        title: data?.title || "",
        description: data?.description || "",
        projectId: data?.projectId || "",
        employeeId: data?.employeeId || "",
        status: data?.status || "TODO",
        priority: data?.priority || "MEDIUM",
        dueDate: data?.dueDate
          ? data.dueDate.substring(0, 10)
          : "",
        estimatedHours:
          data?.estimatedHours !== undefined &&
          data?.estimatedHours !== null
            ? Number(data.estimatedHours)
            : undefined,
      };

      setTask(taskData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: TaskFormData) => {
    if (!id) return;

    try {
      setSubmitting(true);

      await updateTask(id, values);

      toast.success("Task updated successfully.");
      navigate("/tasks");
    } catch (error: any) {
      console.error("UPDATE TASK ERROR:", error);

      toast.error(
        error?.response?.data?.message ??
          "Failed to update task."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading task details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex items-center gap-4">
            <button
              onClick={() => navigate("/tasks")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Edit Task
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Update task configuration.
              </p>
            </div>
          </div>

          <div className="w-full">
            <TaskForm 
              initialData={task} 
              loading={submitting} 
              onSubmit={handleSubmit} 
              projects={projects} 
              employees={employees} 
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EditTaskPage;