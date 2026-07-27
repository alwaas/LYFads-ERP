import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import ProjectCard from "../../components/projects/ProjectCard";

import { getProject } from "../../services/project.service";

import type { Project } from "../../types/project";

function ViewProjectPage() {
  const { id } = useParams();

  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  const loadProject = async (
    projectId: string
  ) => {
    try {
      const data = await getProject(projectId);

      setProject(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Project Details
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : project ? (
          <ProjectCard project={project} />
        ) : (
          <div className="text-red-500">
            Project not found.
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default ViewProjectPage;