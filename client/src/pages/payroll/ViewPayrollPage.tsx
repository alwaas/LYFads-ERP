import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getPayroll } from "../../services/payroll.service";
import { getSalaryStructureByEmployee } from "../../services/salary-structure.service";
import type { Payroll } from "../../types/payroll";

function ViewPayrollPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayroll = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getPayroll(id);
        setPayroll(data);
        if (data.employeeId) {
          const structure = await getSalaryStructureByEmployee(data.employeeId);
          setSalaryStructure(structure);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load payroll.");
        navigate("/payroll");
      } finally {
        setLoading(false);
      }
    };
    loadPayroll();
  }, [id, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  if (loading || !payroll) {
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
                Payroll Details
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {payroll.employee?.user?.fullName} - {payroll.month}/{payroll.year}
              </p>
            </div>
          </div>

          {salaryStructure && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Salary Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Basic Salary</p>
                  <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(salaryStructure.basicSalary))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">HRA</p>
                  <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(salaryStructure.hra))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Allowances</p>
                  <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(salaryStructure.allowances))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Bonus</p>
                  <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(salaryStructure.bonus))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Incentives</p>
                  <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(salaryStructure.incentives))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Deductions</p>
                  <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(salaryStructure.deductions))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Effective From</p>
                  <p className="mt-1 text-sm text-slate-900">{new Date(salaryStructure.effectiveFrom).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Effective To</p>
                  <p className="mt-1 text-sm text-slate-900">{salaryStructure.effectiveTo ? new Date(salaryStructure.effectiveTo).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Active</p>
                  <p className="mt-1 text-sm text-slate-900">{salaryStructure.isActive ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Employee</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.employee?.user?.fullName}</p>
                <p className="text-xs text-slate-500">{payroll.employee?.employeeCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Month / Year</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.month}/{payroll.year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Basic Salary</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.basicSalary))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Gross Salary</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.grossSalary))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Net Salary</p>
                <p className="mt-1 text-sm text-slate-900 font-semibold">{formatCurrency(Number(payroll.netSalary))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Hours</p>
                <p className="mt-1 text-sm text-slate-900">{Number(payroll.totalHours)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Overtime Hours</p>
                <p className="mt-1 text-sm text-slate-900">{Number(payroll.overtimeHours)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Overtime Amount</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.overtimeAmount))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Allowances</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.allowances))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">HRA</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.hra))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Bonus</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.bonus))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Incentives</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.incentives))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">PF</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.pf))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">ESI</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.esi))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">TDS</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.tds))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Deductions</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.deductions))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Deduction</p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(Number(payroll.totalDeduction))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Payslip No</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.payslipNo || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Generated At</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.generatedAt ? new Date(payroll.generatedAt).toLocaleString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Paid At</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.paidAt ? new Date(payroll.paidAt).toLocaleString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Payment Method</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.paymentMethod || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Payment Reference</p>
                <p className="mt-1 text-sm text-slate-900">{payroll.paymentReference || "-"}</p>
              </div>
              {payroll.approvedBy && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Approved By</p>
                  <p className="mt-1 text-sm text-slate-900">{payroll.approvedBy.fullName}</p>
                  <p className="text-xs text-slate-500">{payroll.approvedBy.email}</p>
                </div>
              )}
            </div>
          </div>

          {payroll.items && payroll.items.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Payroll Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-2">{item.type}</td>
                        <td className="px-4 py-2">{item.category}</td>
                        <td className="px-4 py-2">{item.description || "-"}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(Number(item.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewPayrollPage;
