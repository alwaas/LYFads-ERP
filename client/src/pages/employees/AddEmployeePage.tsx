import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import EmployeeForm, { type EmployeeFormData } from "../../components/employees/EmployeeForm";
import { createEmployee } from "../../services/employee.service";

function AddEmployeePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: EmployeeFormData) => {
    try {
      setLoading(true);
      await createEmployee(values);
      toast.success("Employee created successfully.");
      navigate("/employees");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Failed to create employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex items-center gap-4">
            <button
              onClick={() => navigate("/employees")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Add New Employee
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Register a new staff member and create login profile.
              </p>
            </div>
          </div>

          <div className="w-full">
            <EmployeeForm loading={loading} onSubmit={handleSubmit} />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default AddEmployeePage;