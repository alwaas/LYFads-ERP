import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/dashboard.service";

function DashboardHeader() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getDashboardStats();
      setStats(data.data ?? data);
    } catch (error) {
      console.error(error);
    }
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome Back 👋
        </h2>

        <p className="text-gray-500 mt-1">
          {today}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-500">
          Active Employees
        </p>

        <h3 className="text-3xl font-bold text-blue-600">
          {stats?.employees?.total ?? 0}
        </h3>
      </div>
    </div>
  );
}

export default DashboardHeader;