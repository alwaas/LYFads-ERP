import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, User, Calendar, FileText, Clock, Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getDailyWorkReportById, deleteDailyWorkReport } from "../../services/daily-work-report.service";

function ViewDailyWorkReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id]);

  const load = async () => {
    try {
      const data = await getDailyWorkReportById(id!);
      setReport(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load daily work report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this daily work report?")) return;

    try {
      await deleteDailyWorkReport(id);
      toast.success("Daily work report deleted successfully.");
      navigate("/daily-work-reports");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete daily work report.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading daily work report...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-lg font-medium">Daily work report not found.</p>
            <Link
              to="/daily-work-reports"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium text-sm"
            >
              <ArrowLeft size={18} /> Back to Daily Work Reports
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/daily-work-reports"
                className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Daily Work Report Details
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/daily-work-reports/edit/${report.id}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Pencil size={16} /> Edit
              </Link>

              <button
                onClick={handleDelete}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Employee</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{report.employee?.user?.fullName || "-"}</p>
                  <p className="text-xs text-slate-500">{report.employee?.employeeCode || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Report Date</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(report.reportDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-2xs mt-0.5"><Clock size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Hours Worked</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{report.hoursWorked || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Project</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{report.project?.name || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Task</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{report.task?.title || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Created At</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-amber-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div className="w-full">
                  <p className="text-xs text-slate-500 font-medium">Yesterday Work</p>
                  <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                    {report.yesterdayWork || "No information provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div className="w-full">
                  <p className="text-xs text-slate-500 font-medium">Today Work</p>
                  <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                    {report.todayWork || "No information provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div className="w-full">
                  <p className="text-xs text-slate-500 font-medium">Tomorrow Plan</p>
                  <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                    {report.tomorrowPlan || "No information provided."}
                  </p>
                </div>
              </div>
            </div>

            {report.managerRemarks && (
              <div className="pt-2">
                <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                  <div className="w-full">
                    <p className="text-xs text-slate-500 font-medium">Manager Remarks</p>
                    <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                      {report.managerRemarks}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewDailyWorkReportPage;