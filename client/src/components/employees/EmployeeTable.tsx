import type { Employee } from "../../types/employee";
import EmployeeAvatar from "./EmployeeAvatar";
import { Link } from "react-router-dom";

type Props = {
  employees: Employee[];
  onDelete: (id: string) => void;
};

function EmployeeTable({ employees, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left">Employee</th>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Designation</th>
              <th className="px-6 py-4 text-left">Role</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10 text-gray-500"
                >
                  No Employees Found
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        name={employee.user.fullName}
                      />

                      <div>
                        <p className="font-semibold">
                          {employee.user.fullName}
                        </p>

                        <p className="text-sm text-gray-500">
                          {employee.user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {employee.employeeCode}
                  </td>

                  <td className="px-6 py-4">
                    {employee.department}
                  </td>

                  <td className="px-6 py-4">
                    {employee.designation}
                  </td>

                  <td className="px-6 py-4">
                    {employee.user.role}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        employee.user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {employee.user.isActive
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <Link
                      to={`/employees/view/${employee.id}`}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      View
                    </Link>

                    <Link
                      to={`/employees/edit/${employee.id}`}
                      className="text-green-600 hover:underline mr-3"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => onDelete(employee.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeTable;