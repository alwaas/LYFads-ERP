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

import { getDashboardCharts } from "../../services/dashboard.service";

type ChartItem = {
  name: string;
  value: number;
};

type ChartData = {
  projectStatus: ChartItem[];
  taskStatus: ChartItem[];
};

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

function DashboardCharts() {
  const [data, setData] = useState<ChartData>({
    projectStatus: [],
    taskStatus: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharts();
  }, []);

  async function loadCharts() {
    try {
      const charts = await getDashboardCharts();

      setData({
        projectStatus: Array.isArray(charts?.projectStatus)
          ? charts.projectStatus
          : [],
        taskStatus: Array.isArray(charts?.taskStatus)
          ? charts.taskStatus
          : [],
      });
    } catch (error) {
      console.error("Dashboard Charts Error:", error);

      setData({
        projectStatus: [],
        taskStatus: [],
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          Loading Charts...
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          Loading Charts...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

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