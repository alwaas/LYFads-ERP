import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: string;
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border border-gray-100">

      <div className="flex justify-between items-start">

        <div>

          <p className="text-gray-500 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>

          {subtitle && (
            <p className="text-xs text-gray-400 mt-2">
              {subtitle}
            </p>
          )}

        </div>

        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-white ${color}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

export default StatCard;