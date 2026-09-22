import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";

import { getLeaveReport } from "../../services/report.service";
import ExportButton from "../../components/reports/ExportButton";
import type { LeaveReport } from "../../types/report";

function LeaveReportPage() {
  const [report, setReport] = useState<LeaveReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getLeaveReport();
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
              <h1 className="text-3xl font-bold">Leave Report</h1>
              <p className="text-sm text-slate-500">
                {new Date(report.dateFrom).toLocaleDateString()} - {new Date(report.dateTo).toLocaleDateString()}
              </p>
              <p className="text-sm text-slate-500">Total Leaves: {report.totalLeaves}</p>
            </div>
            <ExportButton reportType="leave-report" />
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
                  <th className="px-4 py-3 font-medium text-slate-500">Leave Type</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Start Date</th>
                  <th className="px-4 py-3 font-medium text-slate-500">End Date</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Reason</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{leave.employeeName}</td>
                    <td className="px-4 py-3">{leave.leaveType}</td>
                    <td className="px-4 py-3">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{leave.status}</td>
                    <td className="px-4 py-3">{leave.reason}</td>
                    <td className="px-4 py-3">{leave.rejectionReason || "-"}</td>
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

export default LeaveReportPage;
