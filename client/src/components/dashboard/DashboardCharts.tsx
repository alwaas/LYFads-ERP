import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { getDashboardCharts } from "../../services/dashboardCharts.service";

type ChartData = {
  projectStatus: {
    name: string;
    value: number;
  }[];

  taskStatus: {
    name: string;
    value: number;
  }[];
};

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharts();
  }, []);

  const loadCharts = async () => {
    try {
      const response = await getDashboardCharts();
      setData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        Loading Charts...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-100 text-red-600 rounded-xl p-6">
        Failed to load charts.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      {/* Project Status */}

      <div className="bg-white rounded-xl shadow-md p-6">

        <h2 className="text-xl font-semibold mb-5">
          Project Status
        </h2>

        <ResponsiveContainer width="100%" height={320}>

          <PieChart>

            <Pie
              data={data.projectStatus}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              label
            >
              {data.projectStatus.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>

      {/* Task Status */}

      <div className="bg-white rounded-xl shadow-md p-6">

        <h2 className="text-xl font-semibold mb-5">
          Task Status
        </h2>

        <ResponsiveContainer width="100%" height={320}>

          <BarChart data={data.taskStatus}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="value"
              fill="#2563eb"
              radius={[8, 8, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default DashboardCharts;