import { Link } from "react-router-dom";

type Props = {
  employeeId: string;
};

function EmployeeActions({ employeeId }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold mb-5">
        Actions
      </h3>

      <div className="flex gap-3 flex-wrap">

        <Link
          to={`/employees/edit/${employeeId}`}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Edit Employee
        </Link>

        <Link
          to="/employees"
          className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
        >
          Back
        </Link>

      </div>
    </div>
  );
}

export default EmployeeActions;