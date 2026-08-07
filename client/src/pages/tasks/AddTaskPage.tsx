import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import TaskForm, { type TaskFormData } from "../../components/tasks/TaskForm";
import { createTask } from "../../services/task.service";
import { getProjects } from "../../services/project.service";
import { getEmployees } from "../../services/employee.service";

function AddTaskPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {});
    getEmployees().then(setEmployees).catch(() => {});
  }, []);

  const handleSubmit = async (values: TaskFormData) => {
    try {
      setLoading(true);
      await createTask(values);
      toast.success("Task created successfully.");
      navigate("/tasks");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

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
                Add New Task
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Create and assign a new task.
              </p>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-8">
            <TaskForm loading={loading} onSubmit={handleSubmit} projects={projects} employees={employees} />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default AddTaskPage;