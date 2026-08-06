import { useMemo } from "react";

import KanbanColumn from "./KanbanColumn";

import type {
  KanbanTask,
  KanbanTaskStatus,
} from "../../types/kanban";

type Props = {
  tasks: KanbanTask[];

  onMove: (
    taskId: string,
    status: KanbanTaskStatus
  ) => void;
};

function KanbanBoard({
  tasks,
  onMove,
}: Props) {
  const todo = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "TODO"
      ),
    [tasks]
  );

  const inProgress = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === "IN_PROGRESS"
      ),
    [tasks]
  );

  const review = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "REVIEW"
      ),
    [tasks]
  );

  const completed = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === "COMPLETED"
      ),
    [tasks]
  );

if (tasks.length === 0) {
  return (
    <div className="bg-slate-100 rounded-xl p-10 text-center text-slate-500">
      No tasks available for this project.
    </div>
  );
}

return (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    ...
  </div>
);

  if (tasks.length === 0) {
    return (
        <div className="bg-slate-100 rounded-xl p-10 text-center text-slate-500">
        No tasks available for this project.
        </div>
    );
    }
    return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      <KanbanColumn
        title="To Do"
        status="TODO"
        tasks={todo}
        onMove={onMove}
      />

      <KanbanColumn
        title="In Progress"
        status="IN_PROGRESS"
        tasks={inProgress}
        onMove={onMove}
      />

      <KanbanColumn
        title="Review"
        status="REVIEW"
        tasks={review}
        onMove={onMove}
      />

      <KanbanColumn
        title="Completed"
        status="COMPLETED"
        tasks={completed}
        onMove={onMove}
      />

    </div>
  );
}

export default KanbanBoard;