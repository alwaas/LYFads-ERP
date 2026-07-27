import type { Task } from "../../types/task";

type Props = {
  task: Task;
};

function TaskDetails({ task }: Props) {
  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow p-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <p className="text-sm text-gray-500">
            Task Code
          </p>

          <h3 className="font-semibold">
            {task.taskCode}
          </h3>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Task Title
          </p>

          <h3 className="font-semibold">
            {task.title}
          </h3>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Project
          </p>

          <h3 className="font-semibold">
            {task.project?.name ?? "-"}
          </h3>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Employee
          </p>

          <h3 className="font-semibold">
            {task.employee?.user?.fullName ?? "-"}
          </h3>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Status
          </p>

          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
            {task.status}
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Priority
          </p>

          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm">
            {task.priority}
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Due Date
          </p>

          <h3 className="font-semibold">
            {formatDate(task.dueDate)}
          </h3>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Estimated Hours
          </p>

          <h3 className="font-semibold">
            {task.estimatedHours ?? "-"}
          </h3>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Actual Hours
          </p>

          <h3 className="font-semibold">
            {task.actualHours ?? "-"}
          </h3>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Created At
          </p>

          <h3 className="font-semibold">
            {formatDate(task.createdAt)}
          </h3>
        </div>

      </div>

      <div className="mt-8">

        <p className="text-sm text-gray-500 mb-2">
          Description
        </p>

        <div className="border rounded-lg p-4 bg-gray-50 min-h-[120px]">
          {task.description || "No description available."}
        </div>

      </div>

    </div>
  );
}

export default TaskDetails;