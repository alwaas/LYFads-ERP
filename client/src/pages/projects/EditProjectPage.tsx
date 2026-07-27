import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/projects/ProjectForm";

import {
  getProject,
  updateProject,
} from "../../services/project.service";

import { getClients } from "../../services/client.service";
import { getEmployees } from "../../services/employee.service";

function EditProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [initialValues, setInitialValues] =
    useState<Partial<ProjectFormData>>({});

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (projectId: string) => {
    try {
      const [
        project,
        clientsData,
        employeesData,
      ] = await Promise.all([
        getProject(projectId),
        getClients(),
        getEmployees(),
      ]);

      setClients(clientsData);
      setEmployees(employeesData);

      setInitialValues({
        projectCode: project.projectCode,
        name: project.name,
        description: project.description || "",
        clientId: project.clientId,
        managerId: project.managerId || "",
        status: project.status,
        priority: project.priority,
        budget: Number(project.budget) || undefined,
        startDate: project.startDate
          ? project.startDate.slice(0, 10)
          : "",
        endDate: project.endDate
          ? project.endDate.slice(0, 10)
          : "",
      });
    } catch (error) {
      console.error(error);

      toast.error("Failed to load project.");
    }
  };

  const handleSubmit = async (
    data: ProjectFormData
  ) => {
    try {
      if (!id) return;

      setLoading(true);

      await updateProject(id, data);

      toast.success("Project updated successfully.");

      navigate("/projects");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to update project."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Edit Project
        </h1>

        <ProjectForm
          loading={loading}
          onSubmit={handleSubmit}
          clients={clients}
          employees={employees}
          initialValues={initialValues}
        />

      </div>

    </DashboardLayout>
  );
}

export default EditProjectPage;