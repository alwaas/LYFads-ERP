import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import EmployeeForm, { type EmployeeFormData } from "../../components/employees/EmployeeForm";
import { getEmployee, updateEmployee } from "../../services/employee.service";

function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<EmployeeFormData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadEmployee(id);
  }, [id]);

  const loadEmployee = async (empId: string) => {
    try {
      setLoading(true);

      const response = await getEmployee(empId);

      const employee = response;

      setEmployee({
        fullName: employee.user?.fullName || "",
        email: employee.user?.email || "",
        employeeCode: employee.employeeCode || "",
        phone: employee.phone || "",
        department: employee.department || "",
        designation: employee.designation || "",
        role: employee.user?.role || "EMPLOYEE",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: EmployeeFormData) => {
    if (!id) return;
    try {
      setSubmitting(true);
      await updateEmployee(id, values);
      toast.success("Employee updated successfully.");
      navigate("/employees");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Failed to update employee.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading employee details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

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
                Edit Employee
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Update staff profile and account information.
              </p>
            </div>
          </div>

          <div className="w-full">
            <EmployeeForm defaultValues={employee} loading={submitting} onSubmit={handleSubmit} />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EditEmployeePage;