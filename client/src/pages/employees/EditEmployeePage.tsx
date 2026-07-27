import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmployeeForm, {
  type EmployeeFormData,
} from "../../components/employees/EmployeeForm";

import {
  getEmployee,
  updateEmployee,
} from "../../services/employee.service";

function EditEmployeePage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [employee, setEmployee] =
    useState<EmployeeFormData | null>(null);

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    try {
      const data = await getEmployee(id!);

      setEmployee({
        fullName: data.user.fullName,
        email: data.user.email,
        password: "",
        role: data.user.role,
        employeeCode: data.employeeCode,
        phone: data.phone ?? "",
        designation: data.designation ?? "",
        department: data.department ?? "",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to load employee.");
      navigate("/employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    formData: EmployeeFormData
  ) => {
    try {
      setLoading(true);

      await updateEmployee(id!, formData);

      alert("Employee updated successfully.");

      navigate("/employees");
    } catch (err: any) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Failed to update employee."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !employee) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Edit Employee
        </h1>

        {employee && (
          <EmployeeForm
            defaultValues={employee}
            loading={loading}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default EditEmployeePage;