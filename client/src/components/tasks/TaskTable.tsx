import { Link } from "react-router-dom";

import type { Task } from "../../types/task";

type Props = {
  tasks: Task[];
  onDelete: (id: string) => void;
};

function TaskTable({
  tasks,
  onDelete,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-50 border-b">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                Task
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                Project
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                Employee
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                Status
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                Priority
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">
                Due Date
              </th>

              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 uppercase">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {tasks.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="py-12 text-center text-gray-500"
                >
                  No Tasks Found
                </td>

              </tr>

            ) : (

              tasks.map((task) => (

                <tr
                  key={task.id}
                  className="border-b last:border-b-0 hover:bg-blue-50 transition-colors"
                >

                  <td className="px-6 py-4">

                    <p className="font-semibold">
                      {task.title}
                    </p>

                    <p className="text-sm text-gray-500">
                      {task.taskCode}
                    </p>

                  </td>

                  <td className="px-6 py-4">
                    {task.project.name}
                  </td>

                  <td className="px-6 py-4">
                    {task.employee?.user.fullName ?? "-"}
                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        task.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : task.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : task.status === "REVIEW"
                          ? "bg-yellow-100 text-yellow-700"
                          : task.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {task.status}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        task.priority === "URGENT"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "HIGH"
                          ? "bg-orange-100 text-orange-700"
                          : task.priority === "MEDIUM"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {task.priority}
                    </span>

                  </td>

                  <td className="px-6 py-4">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-6 py-4">

                    <div className="flex justify-center gap-4">

                      <Link
                        to={`/tasks/view/${task.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>

                      <Link
                        to={`/tasks/edit/${task.id}`}
                        className="text-green-600 hover:text-green-800"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => onDelete(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default TaskTable;