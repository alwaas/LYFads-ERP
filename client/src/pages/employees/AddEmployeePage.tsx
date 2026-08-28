import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import EmployeeForm from "../../components/employees/EmployeeForm";
import { createEmployee, getManagers } from "../../services/employee.service";
import { mapServerValidationErrors } from "../../features/validation/errors";

import type { CreateEmployeeFormData, EditEmployeeFormData } from "../../features/validation/employee.schema";

type Manager = {
  id: string;
  user: {
    fullName: string;
  };
};

function AddEmployeePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [managers, setManagers] = useState<Manager[]>([]);

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      const data = await getManagers();
      setManagers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (values: CreateEmployeeFormData | EditEmployeeFormData) => {
    setServerErrors({});
    try {
      setLoading(true);
      await createEmployee(values);
      toast.success("Employee created successfully.");
      navigate("/employees");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ?? "Failed to create employee."
        );
      }
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
            <EmployeeForm loading={loading} onSubmit={handleSubmit} serverErrors={serverErrors} managers={managers} />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default AddEmployeePage;
