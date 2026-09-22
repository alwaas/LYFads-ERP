import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";

import { getPayrollSummaryReport } from "../../services/report.service";
import ExportButton from "../../components/reports/ExportButton";
import type { PayrollSummaryReport } from "../../types/report";

function PayrollSummaryReportPage() {
  const [report, setReport] = useState<PayrollSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPayrollSummaryReport();
        setReport(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-12 text-gray-500">No data available.</div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Payroll Summary Report</h1>
              <p className="text-sm text-slate-500">Total Payrolls: {report.totalPayrolls}</p>
            </div>
            <ExportButton reportType="payroll-summary" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Net Salary</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(report.totalNetSalary)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Basic Salary</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(report.totalBasicSalary)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Payrolls</p>
              <p className="text-2xl font-bold text-slate-900">{report.totalPayrolls}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.byStatus).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{status}</p>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">Employee</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Period</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Basic Salary</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Net Salary</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{payroll.employeeName}</td>
                    <td className="px-4 py-3">{payroll.month}/{payroll.year}</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(payroll.basicSalary)}
                    </td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(payroll.netSalary)}
                    </td>
                    <td className="px-4 py-3">{payroll.status}</td>
                    <td className="px-4 py-3">{payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default PayrollSummaryReportPage;
