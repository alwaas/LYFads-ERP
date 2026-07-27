type StatCardProps = {
  title: string;
  value: number;
  color?: string;
};

function StatCard({
  title,
  value,
  color = "bg-blue-600",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300">

      <div
        className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white text-xl font-bold`}
      >
        #
      </div>

      <h3 className="text-gray-500 mt-4 text-sm">
        {title}
      </h3>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>

    </div>
  );
}

export default StatCard;