import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CheckSquare, Calendar, FileText, Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getTask, deleteTask } from "../../services/task.service";
import type { Task } from "../../types/task";

function ViewTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadTask(id);
  }, [id]);

  const loadTask = async (taskId: string) => {
    try {
      const data = await getTask(taskId);
      setTask(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(id);
      toast.success("Task deleted successfully.");
      navigate("/tasks");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading task details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-lg font-medium">Task not found.</p>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium text-sm"
            >
              <ArrowLeft size={18} /> Back to Tasks
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/tasks"
                className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Task Details
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/tasks/edit/${task.id}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Pencil size={16} /> Edit
              </Link>

              <button
                onClick={handleDelete}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl">
                <CheckSquare size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Task Title</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                  {task.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Created At</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><CheckSquare size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Status</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{task.status || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-amber-600 rounded-lg shadow-2xs mt-0.5"><CheckSquare size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Priority</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{task.priority || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Due Date</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Estimated Hours</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {task.estimatedHours ? Number(task.estimatedHours).toFixed(2) : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Actual Hours</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {task.actualHours ? Number(task.actualHours).toFixed(2) : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-amber-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div className="w-full">
                  <p className="text-xs text-slate-500 font-medium">Description</p>
                  <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                    {task.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewTaskPage;