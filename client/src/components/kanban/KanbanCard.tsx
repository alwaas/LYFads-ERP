import type { KanbanTask } from "../../types/kanban";

type Props = {
  task: KanbanTask;
};

function priorityColor(priority: KanbanTask["priority"]) {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "MEDIUM":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

function KanbanCard({ task }: Props) {
  return (
    <div
      draggable
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-move hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            {task.taskCode}
          </p>

          <h3 className="font-semibold text-slate-900 mt-1">
            {task.title}
          </h3>
        </div>

        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-slate-600 mt-3 line-clamp-3">
          {task.description}
        </p>
      )}

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">
            Assignee
          </span>

          <span className="font-medium">
            {task.employee?.user.fullName ?? "Unassigned"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">
            Due
          </span>

          <span>
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : "-"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">
            Est. Hours
          </span>

          <span>
            {task.estimatedHours ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default KanbanCard;