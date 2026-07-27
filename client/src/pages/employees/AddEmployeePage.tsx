import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmployeeForm from "../../components/employees/EmployeeForm";

import type { EmployeeFormData } from "../../components/employees/EmployeeForm";

import { createEmployee } from "../../services/employee.service";
import toast from "react-hot-toast";

function AddEmployeePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

 const handleSubmit = async (data: EmployeeFormData) => {
    try {
        setLoading(true);

        console.log("FORM DATA:", data);

        const response = await createEmployee(data);

        console.log("API RESPONSE:", response);

        toast.success("Employee created successfully.");

        navigate("/employees");
    } catch (err: any) {
        console.error("FULL ERROR:", err);
        console.error("RESPONSE:", err?.response);
        console.error("DATA:", err?.response?.data);

        toast.error(
        JSON.stringify(err?.response?.data, null, 2) ||
        "Internal Server Error"
        );
    } finally {
        setLoading(false);
    }
    };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Add Employee
        </h1>

        <EmployeeForm
          loading={loading}
          onSubmit={handleSubmit}
        />

      </div>

    </DashboardLayout>
  );
}

export default AddEmployeePage;