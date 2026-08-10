import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import MilestoneForm, {
  type MilestoneFormData,
} from "../../components/milestones/MilestoneForm";

import {
  createMilestone,
} from "../../services/milestone.service";

import {
  getProjects,
} from "../../services/project.service";

import type { Project } from "../../types/project";

import { PATHS } from "../../routes/config/paths";

function AddMilestonePage() {
  const navigate = useNavigate();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [projectsLoading, setProjectsLoading] =
    useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);

        const data = await getProjects();

        setProjects(data ?? []);
      } catch (error) {
        console.error(
          "Failed to load projects:",
          error,
        );

        toast.error("Failed to load projects.");
      } finally {
        setProjectsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  const handleSubmit = async (
    data: MilestoneFormData,
  ) => {
    try {
      setLoading(true);

      await createMilestone({
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        status: data.status,
        priority: data.priority,
        progress: Number(data.progress) || 0,
        startDate: new Date(
          `${data.startDate}T00:00:00.000Z`,
        ).toISOString(),
        deadline: new Date(
          `${data.deadline}T00:00:00.000Z`,
        ).toISOString(),
      });

      toast.success(
        "Milestone created successfully.",
      );

      navigate(PATHS.MILESTONES);
    } catch (error: any) {
      console.error(
        "Failed to create milestone:",
        error,
      );

      const message =
        error?.response?.data?.message;

      toast.error(
        Array.isArray(message)
          ? message[0]
          : message ||
              "Failed to create milestone.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Add Milestone
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create a new project milestone.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {projectsLoading ? (
          <div className="py-10 text-center text-slate-500">
            Loading projects...
          </div>
        ) : (
          <MilestoneForm
            loading={loading}
            projects={projects}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default AddMilestonePage;