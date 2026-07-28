import { useEffect, useState } from "react";
import { getTasks } from "../../services/task.service";

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
      const list = await getTasks();
      setTasks(list.slice(0, 5));
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

              {tasks.map((task) => (

                <tr
                  key={task.id}
                  className="border-b"
                >

                  <td className="py-3">
                    {task.title}
                  </td>

                  <td className="py-3">

                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">

                      {task.status}

                    </span>

                  </td>

                  <td className="py-3">
                    {task.priority}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default RecentTasks;