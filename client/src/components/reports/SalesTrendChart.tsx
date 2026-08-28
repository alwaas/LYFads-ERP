import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type DataPoint = {
  month: string;
  total: number;
};

type Props = {
  data: DataPoint[];
};

function SalesTrendChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-5">Sales Trend</h2>
        <p className="text-gray-500">No sales data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-5">Sales Trend</h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, "Sales"]} />
          <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SalesTrendChart;
