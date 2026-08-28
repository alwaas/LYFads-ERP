import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import PayrollForm from "../../components/payroll/PayrollForm";
import { getPayroll, updatePayroll } from "../../services/payroll.service";
import type { Payroll } from "../../types/payroll";
import { mapServerValidationErrors } from "../../features/validation/errors";

function EditPayrollPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPayroll = async () => {
      if (!id) return;
      try {
        const data = await getPayroll(id);
        setPayroll(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load payroll.");
        navigate("/payroll");
      }
    };
    loadPayroll();
  }, [id, navigate]);

  const handleSubmit = async (values: { employeeId?: string; month?: number; year?: number; basicSalary?: number; totalHours: number; overtimeHours: number; overtimeAmount: number; hra: number; allowances: number; bonus: number; incentives: number; grossSalary: number; pf: number; esi: number; tds: number; deductions: number; totalDeduction: number; netSalary?: number; status?: string; payslipNo?: string }) => {
    if (!id) return;
    setServerErrors({});
    try {
      setLoading(true);
      await updatePayroll(id, values);
      toast.success("Payroll updated successfully.");
      navigate("/payroll");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ?? "Failed to update payroll."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading payroll...</p>
            </div>
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
              onClick={() => navigate("/payroll")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Edit Payroll
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Update payroll details.
              </p>
            </div>
          </div>

          <div className="w-full">
            <PayrollForm
              loading={loading}
              onSubmit={handleSubmit}
              initialData={{
                employeeId: payroll.employeeId,
                month: payroll.month,
                year: payroll.year,
                basicSalary: Number(payroll.basicSalary),
                totalHours: Number(payroll.totalHours),
                overtimeHours: Number(payroll.overtimeHours),
                overtimeAmount: Number(payroll.overtimeAmount),
                hra: Number(payroll.hra),
                allowances: Number(payroll.allowances),
                bonus: Number(payroll.bonus),
                incentives: Number(payroll.incentives),
                grossSalary: Number(payroll.grossSalary),
                pf: Number(payroll.pf),
                esi: Number(payroll.esi),
                tds: Number(payroll.tds),
                deductions: Number(payroll.deductions),
                totalDeduction: Number(payroll.totalDeduction),
                netSalary: Number(payroll.netSalary),
                status: payroll.status,
                payslipNo: payroll.payslipNo || "",
              }}
              isEdit
              serverErrors={serverErrors}
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EditPayrollPage;
