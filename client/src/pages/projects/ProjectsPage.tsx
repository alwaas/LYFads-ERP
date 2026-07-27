import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import ProjectTable from "../../components/projects/ProjectTable";
import ProjectStats from "../../components/projects/ProjectStats";


import {
  getProjects,
  deleteProject,
} from "../../services/project.service";

import type { Project } from "../../types/project";

function ProjectsPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Delete this project?"
    );

    if (!confirmDelete) return;

    try {
      await deleteProject(id);

      toast.success("Project deleted successfully.");

      loadProjects();
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to delete project."
      );
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      return (
        project.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        project.projectCode
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        project.client.companyName
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });
  }, [projects, search]);

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Projects
          </h1>

          <button
            onClick={() =>
              navigate("/projects/add")
            }
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Project
          </button>

        </div>

        <ProjectStats projects={projects} />

        <input
          type="text"
          placeholder="Search Projects..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-3"
        />

        {loading ? (
          <div>
            Loading Projects...
          </div>
        ) : (
          <ProjectTable
            projects={filteredProjects}
            onDelete={handleDelete}
          />
        )}

      </div>

    </DashboardLayout>
  );
}

export default ProjectsPage;