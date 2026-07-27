import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import ProjectForm, {
  type ProjectFormData,
} from "../../components/projects/ProjectForm";

import { createProject } from "../../services/project.service";
import { getClients } from "../../services/client.service";
import { getEmployees } from "../../services/employee.service";

function AddProjectPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, employeesData] =
        await Promise.all([
          getClients(),
          getEmployees(),
        ]);

      setClients(clientsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data.");
    }
  };

  const handleSubmit = async (
    data: ProjectFormData
  ) => {
    try {
      setLoading(true);

      const response = await createProject(data);

      console.log(response);

      toast.success("Project created successfully.");

      navigate("/projects");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to create project."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Add Project
        </h1>

        <ProjectForm
          loading={loading}
          onSubmit={handleSubmit}
          clients={clients}
          employees={employees}
        />

      </div>
    </DashboardLayout>
  );
}

export default AddProjectPage;