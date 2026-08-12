import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Calendar, User, Shield, FileText, Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getLeaveById, deleteLeave } from "../../services/leave.service";

import type { Leave } from "../../types/leave";

function ViewLeavePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLeave(id);
    }
  }, [id]);

  const loadLeave = async (leaveId: string) => {
    try {
      const data = await getLeaveById(leaveId);
      setLeave(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leave.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this leave request?")) return;

    try {
      await deleteLeave(id);
      toast.success("Leave deleted successfully.");
      navigate("/leaves");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete leave.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading leave details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!leave) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-lg font-medium">Leave not found.</p>
            <Link
              to="/leaves"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium text-sm"
            >
              <ArrowLeft size={18} /> Back to Leaves
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/leaves"
                className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Leave Details
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/leaves/edit/${leave.id}`}
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
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Calendar size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Leave Type</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                  {leave.leaveType}
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[leave.status] || "bg-slate-100 text-slate-700"}`}>
                {leave.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Employee</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{leave.employee?.user?.fullName || "-"}</p>
                  <p className="text-xs text-slate-500">{leave.employee?.employeeCode || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">From Date</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(leave.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">To Date</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-2xs mt-0.5"><Shield size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Days</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{leave.totalDays}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Created At</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(leave.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Updated At</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(leave.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-amber-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                <div className="w-full">
                  <p className="text-xs text-slate-500 font-medium">Reason</p>
                  <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                    {leave.reason || "No reason provided."}
                  </p>
                </div>
              </div>
            </div>

            {leave.remarks && (
              <div className="pt-2">
                <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><FileText size={18} /></div>
                  <div className="w-full">
                    <p className="text-xs text-slate-500 font-medium">Remarks</p>
                    <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                      {leave.remarks}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {leave.rejectionReason && (
              <div className="pt-2">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="p-2.5 bg-white text-red-600 rounded-lg shadow-2xs mt-0.5"><Shield size={18} /></div>
                  <div className="w-full">
                    <p className="text-xs text-red-600 font-medium">Rejection Reason</p>
                    <p className="text-red-800 mt-1 text-sm sm:text-base leading-relaxed">
                      {leave.rejectionReason}
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

export default ViewLeavePage;