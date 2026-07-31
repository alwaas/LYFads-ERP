import { useNavigate } from "react-router-dom";

function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <h2 className="mb-4 text-lg font-semibold">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-3">

        <button
          onClick={() => navigate("/employees/add")}
          className="rounded-lg bg-blue-600 p-3 text-white"
        >
          Add Employee
        </button>

        <button
          onClick={() => navigate("/clients/add")}
          className="rounded-lg bg-green-600 p-3 text-white"
        >
          Add Client
        </button>

        <button
          onClick={() => navigate("/projects/add")}
          className="rounded-lg bg-purple-600 p-3 text-white"
        >
          Add Project
        </button>

        <button
          onClick={() => navigate("/tasks/add")}
          className="rounded-lg bg-orange-600 p-3 text-white"
        >
          Add Task
        </button>

      </div>
    </div>
  );
}

export default QuickActions;