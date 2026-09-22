import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";

import { getAttendanceSummaryReport } from "../../services/report.service";
import ExportButton from "../../components/reports/ExportButton";
import type { AttendanceSummaryReport } from "../../types/report";

function AttendanceSummaryReportPage() {
  const [report, setReport] = useState<AttendanceSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAttendanceSummaryReport();
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
              <h1 className="text-3xl font-bold">Attendance Summary Report</h1>
              <p className="text-sm text-slate-500">
                {new Date(report.dateFrom).toLocaleDateString()} - {new Date(report.dateTo).toLocaleDateString()}
              </p>
            </div>
            <ExportButton reportType="attendance-summary" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">Employee</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Total Days</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Present Days</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Absent Days</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Late Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.summary.map((row) => (
                  <tr key={row.employeeId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.employeeName}</td>
                    <td className="px-4 py-3">{row.totalDays}</td>
                    <td className="px-4 py-3">{row.presentDays}</td>
                    <td className="px-4 py-3">{row.absentDays}</td>
                    <td className="px-4 py-3">{row.lateDays}</td>
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

export default AttendanceSummaryReportPage;
