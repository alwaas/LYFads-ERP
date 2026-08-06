import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import KanbanBoard from "../../components/kanban/KanbanBoard";

import {
  getKanbanBoard,
  moveTask,
} from "../../services/kanban.service";

import type {
  KanbanTask,
  KanbanTaskStatus,
} from "../../types/kanban";

function KanbanPage() {
  const { projectId } = useParams();

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBoard = useCallback(async () => {
    try {
      const data = await getKanbanBoard(projectId!);

      setTasks(data);
    } catch (error) {
      console.error(error);

      toast.error("Failed to load board.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
        loadBoard();
    }
  }, [loadBoard, projectId]);


  const handleMove = async (
    taskId: string,
    status: KanbanTaskStatus
  ) => {
    try {
      await moveTask(taskId, { status,});

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task
        )
      );

      toast.success("Task moved.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to move task.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            Kanban Board
          </h1>

          <p className="text-slate-500 mt-1">
            Drag & Drop Tasks
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            Loading...
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onMove={handleMove}
          />
        )}

      </div>
    </DashboardLayout>
  );
}

export default KanbanPage;