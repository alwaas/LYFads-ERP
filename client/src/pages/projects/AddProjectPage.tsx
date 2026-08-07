import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import ProjectForm, { type ProjectFormData } from "../../components/projects/ProjectForm";
import { createProject } from "../../services/project.service";
import { getClients } from "../../services/client.service";
import { getEmployees } from "../../services/employee.service";

function AddProjectPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    getClients().then(setClients).catch(() => {});
    getEmployees().then(setEmployees).catch(() => {});
  }, []);

  const handleSubmit = async (values: ProjectFormData) => {
    try {
      setLoading(true);
      await createProject(values);
      toast.success("Project created successfully.");
      navigate("/projects");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Failed to create project.");
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
              onClick={() => navigate("/projects")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Add New Project
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Create a new project workspace.
              </p>
            </div>
          </div>

          <div className="w-full">
            <ProjectForm
              loading={loading}
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

export default AddProjectPage;