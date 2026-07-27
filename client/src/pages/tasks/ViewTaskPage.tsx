import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import TaskDetails from "../../components/tasks/TaskDetails";

import { getTask } from "../../services/task.service";

import type { Task } from "../../types/task";

function ViewTaskPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    if (id) {
      loadTask(id);
    }
  }, [id]);

  const loadTask = async (taskId: string) => {
    try {
      const data = await getTask(taskId);

      setTask(data);
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ??
          "Failed to load task."
      );

      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Task Details
        </h1>

        {loading ? (
          <div>
            Loading Task...
          </div>
        ) : task ? (
          <TaskDetails task={task} />
        ) : (
          <div className="text-red-600">
            Task not found.
          </div>
        )}

      </div>

    </DashboardLayout>
  );
}

export default ViewTaskPage;