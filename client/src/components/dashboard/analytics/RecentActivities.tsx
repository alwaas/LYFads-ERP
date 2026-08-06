import { useEffect, useState } from "react";

import { getRecentActivities } from "../../../services/dashboard.service";

type Activity = {
  id: string;
  action: string;
  module: string;
  description?: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
};

function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const response = await getRecentActivities();

      setActivities(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Recent Activities Error:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-5">
        Recent Activities
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : activities.length === 0 ? (
        <p className="text-gray-500">
          No recent activities found.
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border-b pb-3 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">
                    {activity.action}
                  </p>

                  <p className="text-sm text-slate-500">
                    {activity.module}
                  </p>

                  <p className="text-sm mt-1">
                    {activity.description ?? "-"}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {activity.user?.fullName ?? "System"}
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentActivities;