import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type AgingData = {
  '0-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
};

type Props = {
  data: AgingData;
};

const COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"];

function ReceivablesAgingChart({ data }: Props) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  if (!chartData.some((d) => d.value > 0)) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-5">Receivables Aging</h2>
        <p className="text-gray-500">No outstanding receivables for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-5">Receivables Aging</h2>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={110}
            label
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ReceivablesAgingChart;
