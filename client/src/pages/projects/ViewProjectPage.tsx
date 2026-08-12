import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  FileText,
  Pencil,
  Trash2,
  Paperclip,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";

import {
  getProject,
  deleteProject,
} from "../../services/project.service";

import type { Project } from "../../types/project";

import AttachmentUploader from "../../components/attachments/AttachmentUploader";
import AttachmentList from "../../components/attachments/AttachmentList";

function ViewProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] = useState(true);

  const [attachmentRefreshKey, setAttachmentRefreshKey] =
    useState(0);

  useEffect(() => {
    if (id) {
      void loadProject(id);
    }
  }, [id]);

  const loadProject = async (projectId: string) => {
    try {
      setLoading(true);

      const data = await getProject(projectId);

      setProject(data);
    } catch (error) {
      console.error(
        "Failed to load project:",
        error,
      );

      toast.error(
        "Failed to load project details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this project?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(id);

      toast.success(
        "Project deleted successfully.",
      );

      navigate("/projects");
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error,
      );

      toast.error(
        "Failed to delete project.",
      );
    }
  };

  const handleAttachmentUploaded = () => {
    setAttachmentRefreshKey(
      (current) => current + 1,
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="text-sm font-medium text-slate-500">
                Loading project details...
              </p>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">
                Project not found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The requested project could not be found.
              </p>

              <Link
                to="/projects"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <ArrowLeft size={16} />
                Back to Projects
              </Link>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">

          {/* =========================
              HEADER
          ========================== */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-4">
              <Link
                to="/projects"
                className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50"
                title="Back to Projects"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Project
                </p>

                <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Project Details
                </h1>
              </div>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Link
                to={`/projects/edit/${project.id}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600 sm:flex-none"
              >
                <Pencil size={16} />
                Edit
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 sm:flex-none"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          {/* =========================
              PROJECT DETAILS
          ========================== */}
          <div className="w-full space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            {/* Project Identity */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="rounded-2xl bg-indigo-50 p-3.5 text-indigo-600">
                <FolderKanban size={28} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Project Name
                </p>

                <h2 className="mt-0.5 truncate text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {project.name}
                </h2>
              </div>
            </div>

            {/* Project Metadata */}
            <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">

              {/* Project Code */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-blue-600 shadow-sm">
                  <FileText size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Project Code
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {project.projectCode || "-"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-emerald-600 shadow-sm">
                  <FolderKanban size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Status
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {project.status || "-"}
                  </p>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-amber-600 shadow-sm">
                  <FolderKanban size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Priority
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {project.priority || "-"}
                  </p>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-purple-600 shadow-sm">
                  <Calendar size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Start Date
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-purple-600 shadow-sm">
                  <Calendar size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    End Date
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-emerald-600 shadow-sm">
                  <FileText size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Budget
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {project.budget ? `$${Number(project.budget).toFixed(2)}` : "-"}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-blue-600 shadow-sm">
                  <FolderKanban size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Progress
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {project.progress ?? 0}%
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-purple-600 shadow-sm">
                  <Calendar size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Created At
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {new Date(project.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mt-0.5 rounded-lg bg-white p-2.5 text-amber-600 shadow-sm">
                  <FileText size={18} />
                </div>

                <div className="w-full min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Description
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 sm:text-base">
                    {project.description ||
                      "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================
              ATTACHMENTS
          ========================== */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            {/* Attachments Header */}
            <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Paperclip size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Attachments
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Files attached to this project
                  </p>
                </div>
              </div>

              <AttachmentUploader
                projectId={project.id}
                onUploaded={
                  handleAttachmentUploaded
                }
              />
            </div>

            {/* Attachment List */}
            <AttachmentList
              projectId={project.id}
              refreshKey={attachmentRefreshKey}
            />
          </section>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewProjectPage;