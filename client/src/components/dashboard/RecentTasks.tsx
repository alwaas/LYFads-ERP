import { useEffect, useState } from "react";
import { getRecentTasks } from "../../services/dashboard.service";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

function RecentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await getRecentTasks();

      setTasks(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-semibold mb-5">
        Recent Tasks
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left py-3">
                  Task
                </th>

                <th className="text-left py-3">
                  Status
                </th>

                <th className="text-left py-3">
                  Priority
                </th>

              </tr>

            </thead>

            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-10 text-gray-500"
                  >
                    No Recent Tasks
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3">
                      {task.title}
                    </td>

                    <td className="py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          task.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : task.status === "TODO"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td className="py-3">
                      {task.priority}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default RecentTasks;