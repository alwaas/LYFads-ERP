import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import MilestoneTable from "../../components/milestones/MilestoneTable";
import {
  deleteMilestone,
  getMilestones,
} from "../../services/milestone.service";

import type { Milestone } from "../../types/milestone";
import { PATHS } from "../../routes/config/paths";

function MilestonesPage() {
  const navigate = useNavigate();

  const [milestones, setMilestones] = useState<
    Milestone[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [priorityFilter, setPriorityFilter] =
    useState("ALL");

  const loadMilestones = async () => {
    try {
      setLoading(true);

      const data = await getMilestones();

      setMilestones(data ?? []);
    } catch (error) {
      console.error(
        "Failed to load milestones:",
        error,
      );

      toast.error("Failed to load milestones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMilestones();
  }, []);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((milestone) => {
      const statusMatches =
        statusFilter === "ALL" ||
        milestone.status === statusFilter;

      const priorityMatches =
        priorityFilter === "ALL" ||
        milestone.priority === priorityFilter;

      return statusMatches && priorityMatches;
    });
  }, [
    milestones,
    statusFilter,
    priorityFilter,
  ]);

  const handleDelete = async (id: string) => {
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

      setMilestones((current) =>
        current.filter(
          (milestone) => milestone.id !== id,
        ),
      );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Milestones
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track project milestones, deadlines and progress.
          </p>
        </div>

        <Link
          to={PATHS.ADD_MILESTONE}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Milestone
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="NOT_STARTED">
                Not Started
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="ON_HOLD">
                On Hold
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Priority
            </label>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">
                All Priorities
              </option>

              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <MilestoneTable
        milestones={filteredMilestones}
        loading={loading}
        onView={(id) =>
          navigate(
            PATHS.VIEW_MILESTONE.replace(
              ":id",
              id,
            ),
          )
        }
        onEdit={(id) =>
          navigate(
            PATHS.EDIT_MILESTONE.replace(
              ":id",
              id,
            ),
          )
        }
        onDelete={handleDelete}
      />
    </div>
  );
}

export default MilestonesPage;