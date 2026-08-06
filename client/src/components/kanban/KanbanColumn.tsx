import KanbanCard from "./KanbanCard";

import type {
  KanbanTask,
  KanbanTaskStatus,
} from "../../types/kanban";

type Props = {
  title: string;

  status: KanbanTaskStatus;

  tasks: KanbanTask[];

  onMove: (
    taskId: string,
    status: KanbanTaskStatus
  ) => void;
};

function KanbanColumn({
  title,
  status,
  tasks,
  onMove,
}: Props) {
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    const taskId = e.dataTransfer.getData("taskId");

    if (taskId) {
      onMove(taskId, status);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="bg-slate-100 rounded-xl p-4 min-h-[650px]"
    >
      <div className="flex items-center justify-between mb-5">

        <h2 className="font-bold text-lg">
          {title}
        </h2>

        <span className="bg-white rounded-full px-3 py-1 text-sm font-semibold">
          {tasks.length}
        </span>

      </div>

      <div className="space-y-4">

        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData(
                "taskId",
                task.id
              )
            }
          >
            <KanbanCard task={task} />
          </div>
        ))}

      </div>
    </div>
  );
}

export default KanbanColumn;