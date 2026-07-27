import { useEffect, useState } from "react";
import { getActivity } from "../../services/activity.service";

type Activity = {
  id: string;
  message: string;
  createdAt: string;
};

function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const response = await getActivity();

      const list =
        response.items ??
        response.activities ??
        response.data ??
        response;

      setActivities(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-5">
        Recent Activity
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : activities.length === 0 ? (
        <p className="text-gray-500">
          No recent activity.
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border-l-4 border-blue-600 pl-4"
            >
              <p className="font-medium">
                {activity.message}
              </p>

              <p className="text-sm text-gray-500">
                {new Date(
                  activity.createdAt
                ).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;