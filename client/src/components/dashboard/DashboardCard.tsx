type DashboardCardProps = {
  title: string;
  value: number | string;
  color?: string;
};

function DashboardCard({
  title,
  value,
  color = "bg-blue-600",
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-white text-xl font-bold`}
        >
          📊
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;