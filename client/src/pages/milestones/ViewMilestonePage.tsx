import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";

import {
  deleteMilestone,
  getMilestone,
} from "../../services/milestone.service";

import type { Milestone } from "../../types/milestone";

import { PATHS } from "../../routes/config/paths";

const formatLabel = (value: string) =>
  value.replace(/_/g, " ");

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
};

const statusClasses: Record<string, string> = {
  NOT_STARTED:
    "bg-slate-100 text-slate-700",
  IN_PROGRESS:
    "bg-blue-100 text-blue-700",
  COMPLETED:
    "bg-emerald-100 text-emerald-700",
  ON_HOLD:
    "bg-amber-100 text-amber-700",
};

const priorityClasses: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

function ViewMilestonePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [milestone, setMilestone] =
    useState<Milestone | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!id) {
      toast.error("Milestone ID is missing.");
      navigate(PATHS.MILESTONES);
      return;
    }

    const loadMilestone = async () => {
      try {
        setLoading(true);

        const data = await getMilestone(id);

        setMilestone(data);
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

    void loadMilestone();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this milestone?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMilestone(id);

      toast.success(
        "Milestone deleted successfully.",
      );

      navigate(PATHS.MILESTONES);
    } catch (error) {
      console.error(
        "Failed to delete milestone:",
        error,
      );

      toast.error(
        "Failed to delete milestone.",
      );
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        Loading milestone...
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-800">
          Milestone not found
        </h2>

        <Link
          to={PATHS.MILESTONES}
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to Milestones
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            to={PATHS.MILESTONES}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Milestones
          </Link>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {milestone.title}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {milestone.project?.name ??
              "Unknown Project"}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to={PATHS.EDIT_MILESTONE.replace(
              ":id",
              milestone.id,
            )}
            className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Milestone Details
            </h2>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-500">
                Description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-slate-700">
                {milestone.description ||
                  "No description provided."}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Progress
              </h2>

              <span className="text-lg font-bold text-blue-600">
                {milestone.progress}%
              </span>
            </div>

            <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${Math.min(
                    Math.max(
                      milestone.progress,
                      0,
                    ),
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Summary
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  statusClasses[
                    milestone.status
                  ] ??
                  "bg-slate-100 text-slate-700"
                }`}
              >
                {formatLabel(
                  milestone.status,
                )}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Priority
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  priorityClasses[
                    milestone.priority
                  ] ??
                  "bg-slate-100 text-slate-700"
                }`}
              >
                {formatLabel(
                  milestone.priority,
                )}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Project
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {milestone.project?.name ??
                  "Unknown Project"}
              </p>

              {milestone.project?.projectCode && (
                <p className="text-sm text-slate-500">
                  {
                    milestone.project
                      .projectCode
                  }
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Start Date
              </p>

              <p className="mt-1 text-slate-700">
                {formatDate(
                  milestone.startDate,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Deadline
              </p>

              <p className="mt-1 text-slate-700">
                {formatDate(
                  milestone.deadline,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Created
              </p>

              <p className="mt-1 text-slate-700">
                {formatDate(
                  milestone.createdAt,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewMilestonePage;