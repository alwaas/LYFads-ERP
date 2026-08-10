import type { Milestone } from "../../types/milestone";

type Props = {
  milestones: Milestone[];
  loading?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

function MilestoneTable({
  milestones,
  loading,
  onView,
  onEdit,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading milestones...
      </div>
    );
  }

  if (!milestones.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h3 className="text-lg font-semibold text-slate-800">
          No milestones found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Create a milestone to start tracking project progress.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Milestone
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Project
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Priority
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Progress
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Deadline
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {milestones.map((milestone) => (
              <tr
                key={milestone.id}
                className="transition hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {milestone.title}
                    </p>

                    {milestone.description && (
                      <p className="mt-1 max-w-xs truncate text-sm text-slate-500">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-slate-800">
                    {milestone.project?.name ?? "Unknown Project"}
                  </p>

                  {milestone.project?.projectCode && (
                    <p className="text-xs text-slate-500">
                      {milestone.project.projectCode}
                    </p>
                  )}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusClasses[milestone.status] ??
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {formatLabel(milestone.status)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      priorityClasses[milestone.priority] ??
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {formatLabel(milestone.priority)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="w-32">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Progress
                      </span>

                      <span className="font-semibold text-slate-700">
                        {milestone.progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${Math.min(
                            Math.max(milestone.progress, 0),
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {formatDate(milestone.deadline)}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(milestone.id)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(milestone.id)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(milestone.id)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MilestoneTable;