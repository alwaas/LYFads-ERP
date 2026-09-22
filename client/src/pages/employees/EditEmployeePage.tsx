import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import EmployeeForm from "../../components/employees/EmployeeForm";
import { getEmployee, updateEmployee } from "../../services/employee.service";
import { mapServerValidationErrors } from "../../features/validation/errors";

import type { EditEmployeeFormData } from "../../features/validation/employee.schema";

function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Partial<EditEmployeeFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) loadEmployee(id);
  }, [id]);

  const loadEmployee = async (empId: string) => {
    try {
      setLoading(true);
      const response = await getEmployee(empId);
      setEmployee({
        fullName: response.user?.fullName || "",
        email: response.user?.email || "",
        employeeCode: response.employeeCode || "",
        phone: response.phone || "",
        department: response.department || "",
        designation: response.designation || "",
        role: response.user?.role as EditEmployeeFormData["role"] || "EMPLOYEE",
        status: response.status as EditEmployeeFormData["status"] || "ACTIVE",
        managerId: response.managerId || "",
        bankName: response.bankName || "",
        bankAccountNumber: response.bankAccountNumber || "",
        ifscCode: response.ifscCode || "",
        emergencyContactName: response.emergencyContactName || "",
        emergencyContactPhone: response.emergencyContactPhone || "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: EditEmployeeFormData) => {
    if (!id) return;
    setServerErrors({});
    try {
      setSubmitting(true);
      await updateEmployee(id, values);
      toast.success("Employee updated successfully.");
      navigate("/employees");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ?? "Failed to update employee."
        );
      }
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
            <EmployeeForm
              defaultValues={employee}
              loading={submitting}
              onSubmit={handleSubmit}
              serverErrors={serverErrors}
              managers={[]}
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EditEmployeePage;
