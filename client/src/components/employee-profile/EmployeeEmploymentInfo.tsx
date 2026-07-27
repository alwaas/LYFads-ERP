import type { Employee } from "../../types/employee";

type Props = {
  employee: Employee;
};

function EmployeeEmploymentInfo({ employee }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold mb-5">
        Employment Information
      </h3>

      <div className="space-y-3">

        <div>
          <strong>Employee Code:</strong>
          <p>{employee.employeeCode}</p>
        </div>

        <div>
          <strong>Department:</strong>
          <p>{employee.department || "-"}</p>
        </div>

        <div>
          <strong>Designation:</strong>
          <p>{employee.designation || "-"}</p>
        </div>

        <div>
          <strong>Role:</strong>
          <p>{employee.user.role}</p>
        </div>

        <div>
          <strong>Joining Date:</strong>
          <p>{employee.joiningDate || "-"}</p>
        </div>

        <div>
          <strong>Salary:</strong>
          <p>{employee.salary || "-"}</p>
        </div>

      </div>
    </div>
  );
}

export default EmployeeEmploymentInfo;