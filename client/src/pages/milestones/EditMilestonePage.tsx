import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";

import MilestoneForm, {
  type MilestoneFormData,
} from "../../components/milestones/MilestoneForm";

import {
  getMilestone,
  updateMilestone,
} from "../../services/milestone.service";

import {
  getProjects,
} from "../../services/project.service";

import type { Project } from "../../types/project";
import type { Milestone } from "../../types/milestone";

import { PATHS } from "../../routes/config/paths";

function EditMilestonePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [milestone, setMilestone] =
    useState<Milestone | null>(null);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!id) {
      toast.error("Milestone ID is missing.");
      navigate(PATHS.MILESTONES);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const [milestoneData, projectData] =
          await Promise.all([
            getMilestone(id),
            getProjects(),
          ]);

        setMilestone(milestoneData);
        setProjects(projectData ?? []);
      } catch (error) {
        console.error(
          "Failed to load milestone:",
          error,
        );

        toast.error(
          "Failed to load milestone.",
        );

        navigate(PATHS.MILESTONES);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [id, navigate]);

  const handleSubmit = async (
    data: MilestoneFormData,
  ) => {
    if (!id) {
      return;
    }

    try {
      setSaving(true);

      await updateMilestone(id, {
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
        "Milestone updated successfully.",
      );

      navigate(
        PATHS.VIEW_MILESTONE.replace(
          ":id",
          id,
        ),
      );
    } catch (error: any) {
      console.error(
        "Failed to update milestone:",
        error,
      );

      const message =
        error?.response?.data?.message;

      toast.error(
        Array.isArray(message)
          ? message[0]
          : message ||
              "Failed to update milestone.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toInputDate = (
    value?: string | null,
  ) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        Loading milestone...
      </div>
    );
  }

  if (!milestone) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Edit Milestone
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update milestone details and progress.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MilestoneForm
          loading={saving}
          projects={projects}
          onSubmit={handleSubmit}
          initialValues={{
            title: milestone.title,
            description:
              milestone.description ?? "",
            projectId: milestone.projectId,
            status: milestone.status,
            priority: milestone.priority,
            progress: milestone.progress,
            startDate: toInputDate(
              milestone.startDate,
            ),
            deadline: toInputDate(
              milestone.deadline,
            ),
          }}
        />
      </div>
    </div>
  );
}

export default EditMilestonePage;