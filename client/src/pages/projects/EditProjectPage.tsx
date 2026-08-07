import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import ProjectForm, { type ProjectFormData } from "../../components/projects/ProjectForm";
import { getProject, updateProject } from "../../services/project.service";
import { getClients } from "../../services/client.service";
import { getEmployees } from "../../services/employee.service";

function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectFormData | undefined>(undefined);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
    getClients().then(setClients).catch(() => {});
    getEmployees().then(setEmployees).catch(() => {});
  }, [id]);

  const loadProject = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: ProjectFormData) => {
    if (!id) return;
    try {
      setSubmitting(true);
      await updateProject(id, values);
      toast.success("Project updated successfully.");
      navigate("/projects");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Failed to update project.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading project details...</p>
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
              onClick={() => navigate("/projects")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Edit Project
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Update existing project settings.
              </p>
            </div>
          </div>

          <div className="w-full">
            <ProjectForm
              initialValues={project}
              loading={submitting}
              onSubmit={handleSubmit}
              clients={clients}
              employees={employees}
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EditProjectPage;