import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, FolderKanban, Calendar, FileText, Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getProject, deleteProject } from "../../services/project.service";
import type { Project } from "../../types/project";

function ViewProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProject(id);
  }, [id]);

  const loadProject = async (projectId: string) => {
    try {
      const data = await getProject(projectId);
      setProject(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(id);
      toast.success("Project deleted successfully.");
      navigate("/projects");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading project details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-lg font-medium">Project not found.</p>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium text-sm"
            >
              <ArrowLeft size={18} /> Back to Projects
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
          
          {/* Header */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/projects"
                className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Project Details
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/projects/edit/${project.id}`}
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

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FolderKanban size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Project Name</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                  {project.name}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Created At</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(project.createdAt).toLocaleString()}
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
                    {project.description || "No description provided."}
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

export default ViewProjectPage;