import { useEffect, useState } from "react";

import { getUpcomingDeadlines } from "../../../services/dashboard.service";

type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  employee?: {
    user: {
      fullName: string;
    };
  };
  project?: {
    name: string;
  };
};

function UpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeadlines();
  }, []);

  async function loadDeadlines() {
    try {
      const response = await getUpcomingDeadlines();

      setDeadlines(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Upcoming Deadlines Error:", error);
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-5">
        Upcoming Deadlines
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : deadlines.length === 0 ? (
        <p className="text-gray-500">
          No upcoming deadlines.
        </p>
      ) : (
        <div className="space-y-4">
          {deadlines.map((item) => (
            <div
              key={item.id}
              className="border-l-4 border-amber-500 pl-4"
            >
              <p className="font-semibold">
                {item.title}
              </p>

              <p className="text-sm text-gray-500">
                Project: {item.project?.name ?? "-"}
              </p>

              <p className="text-sm text-gray-500">
                Employee:{" "}
                {item.employee?.user.fullName ?? "-"}
              </p>

              <p className="text-sm text-red-600">
                Due:{" "}
                {new Date(item.dueDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingDeadlines;