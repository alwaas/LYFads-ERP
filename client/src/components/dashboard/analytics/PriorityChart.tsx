import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import { getPriorityChart } from "../../../services/dashboard.service";

type PriorityItem = {
  name: string;
  value: number;
};

const COLORS = [
  "#22c55e", // Low
  "#f59e0b", // Medium
  "#ef4444", // High
  "#7c3aed", // Urgent
];

function PriorityChart() {
  const [data, setData] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChart();
  }, []);

  async function loadChart() {
    try {
      const response = await getPriorityChart();

      setData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Priority Chart Error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        Loading Priority Chart...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-5">
        Task Priority
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={110}
            label
          >
            {data.map((_, index) => (
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
  );
}

export default PriorityChart;