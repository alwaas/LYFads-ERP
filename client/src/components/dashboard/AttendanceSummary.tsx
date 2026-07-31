import { Link } from "react-router-dom";

function PendingTasks() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <div className="flex justify-between items-center mb-5">

        <h2 className="text-xl font-semibold">
          Pending Tasks
        </h2>

        <Link
          to="/tasks"
          className="text-blue-600 hover:underline text-sm"
        >
          View All
        </Link>

      </div>

      <div className="space-y-4">

        <div className="border rounded-xl p-4 hover:bg-gray-50">
          <p className="font-semibold">
            Design Homepage
          </p>

          <p className="text-sm text-gray-500">
            Assigned to Rahul
          </p>
        </div>

        <div className="border rounded-xl p-4 hover:bg-gray-50">
          <p className="font-semibold">
            Client Meeting
          </p>

          <p className="text-sm text-gray-500">
            Assigned to Aman
          </p>
        </div>

        <div className="border rounded-xl p-4 hover:bg-gray-50">
          <p className="font-semibold">
            Deploy Website
          </p>

          <p className="text-sm text-gray-500">
            Assigned to Riya
          </p>
        </div>

      </div>

    </div>
  );
}

export default PendingTasks;