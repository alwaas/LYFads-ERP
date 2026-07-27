import type { Employee } from "../../types/employee";

type Props = {
  employee: Employee;
};

function EmployeeProfileCard({ employee }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-6">
      <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
        {employee.user.fullName.charAt(0)}
      </div>

      <div>
        <h2 className="text-2xl font-bold">
          {employee.user.fullName}
        </h2>

        <p className="text-gray-500">
          {employee.designation || "No Designation"}
        </p>

        <div className="mt-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              employee.user.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {employee.user.isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfileCard;