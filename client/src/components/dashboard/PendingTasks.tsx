import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { getRecentTasks } from "../../services/dashboard.service";

type Task = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate?: string;
};

export default function PendingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const response = await getRecentTasks();

      const tasks = Array.isArray(response)
        ? response
        : [];


      const pending = tasks.filter(
        (task: Task) => task.status !== "COMPLETED"
      );

      setTasks(pending);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-semibold mb-5">
        Pending Tasks
      </h2>

      {loading ? (

        <p>Loading...</p>

      ) : tasks.length === 0 ? (

        <p className="text-gray-500">
          No Pending Tasks
        </p>

      ) : (

        <div className="space-y-4">

          {tasks.map((task) => (

            <div
              key={task.id}
              className="flex justify-between items-center border rounded-lg p-4"
            >

              <div>

                <p className="font-medium">
                  {task.title}
                </p>

                <p className="text-sm text-gray-500">
                  Priority : {task.priority}
                </p>

              </div>

              <div className="flex items-center gap-2 text-orange-600">

                <Clock size={18} />

                <span className="text-sm">

                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "-"}

                </span>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}