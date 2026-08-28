import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";

import { getEmployeeDirectoryReport } from "../../services/report.service";
import type { EmployeeDirectoryReport } from "../../types/report";

function EmployeeDirectoryReportPage() {
  const [report, setReport] = useState<EmployeeDirectoryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getEmployeeDirectoryReport();
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
          <div>
            <h1 className="text-3xl font-bold">Employee Directory Report</h1>
            <p className="text-sm text-slate-500">Total Employees: {report.total}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">Employee Code</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Department</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Designation</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Phone</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Joining Date</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.data.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{emp.employeeCode}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{emp.fullName}</td>
                    <td className="px-4 py-3">{emp.email}</td>
                    <td className="px-4 py-3">{emp.role}</td>
                    <td className="px-4 py-3">{emp.department || "-"}</td>
                    <td className="px-4 py-3">{emp.designation || "-"}</td>
                    <td className="px-4 py-3">{emp.phone || "-"}</td>
                    <td className="px-4 py-3">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">{emp.status}</td>
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

export default EmployeeDirectoryReportPage;
