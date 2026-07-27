import type { Employee } from "../../types/employee";

type Props = {
  employee: Employee;
};

function EmployeePersonalInfo({ employee }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold mb-5">
        Personal Information
      </h3>

      <div className="space-y-3">

        <div>
          <strong>Email:</strong>
          <p>{employee.user.email}</p>
        </div>

        <div>
          <strong>Phone:</strong>
          <p>{employee.phone || "-"}</p>
        </div>

        <div>
          <strong>Address:</strong>
          <p>{employee.address || "-"}</p>
        </div>

        <div>
          <strong>City:</strong>
          <p>{employee.city || "-"}</p>
        </div>

        <div>
          <strong>State:</strong>
          <p>{employee.state || "-"}</p>
        </div>

        <div>
          <strong>Country:</strong>
          <p>{employee.country || "-"}</p>
        </div>

      </div>
    </div>
  );
}

export default EmployeePersonalInfo;