import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { deleteLead, getLead } from "../../services/crm.service";

import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  BadgeIndianRupee, 
  Calendar, 
  FileText, 
  Pencil, 
  Trash2 
} from "lucide-react";

import type { Lead } from "../../types/lead";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-cyan-100 text-cyan-700",
  QUALIFIED: "bg-green-100 text-green-700",
  PROPOSAL: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
};

const sourceColors: Record<string, string> = {
  WEBSITE: "bg-blue-100 text-blue-700",
  FACEBOOK: "bg-indigo-100 text-indigo-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
  GOOGLE: "bg-red-100 text-red-700",
  REFERRAL: "bg-green-100 text-green-700",
  WHATSAPP: "bg-emerald-100 text-emerald-700",
  OTHER: "bg-slate-100 text-slate-700",
};

function ViewLeadPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLead(id);
    }
  }, [id]);

  const loadLead = async (leadId: string) => {
    try {
      const data = await getLead(leadId);
      setLead(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load lead.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      await deleteLead(id);
      toast.success("Lead deleted successfully.");
      navigate("/crm");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete lead.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading lead details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-lg font-medium">Lead not found.</p>
            <Link
              to="/crm"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium text-sm"
            >
              <ArrowLeft size={18} /> Back to CRM
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
          
          {/* Top Header with Back Button & Actions */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/crm"
                className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Lead Details
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/crm/edit/${lead.id}`}
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

          {/* Lead Details Card - Full Width */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full">
            
            {/* Company & Status Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Building2 size={28} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Company Name</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                    {lead.companyName}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[lead.status] ?? "bg-slate-100 text-slate-700"}`}>
                  {lead.status}
                </span>
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${sourceColors[lead.source] ?? "bg-slate-100 text-slate-700"}`}>
                  {lead.source || "N/A"}
                </span>
              </div>
            </div>

            {/* Grid Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Contact Person</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{lead.contactPerson}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email Address</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5 break-all">{lead.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{lead.phone || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-2xs mt-0.5">
                  <BadgeIndianRupee size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Estimated Value</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    ₹{Number(lead.estimatedValue ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Created At</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">
                    {new Date(lead.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

            </div>

            {/* Remarks Section */}
            <div className="pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-amber-600 rounded-lg shadow-2xs mt-0.5">
                  <FileText size={18} />
                </div>
                <div className="w-full">
                  <p className="text-xs text-slate-500 font-medium">Remarks</p>
                  <p className="text-slate-800 mt-1 text-sm sm:text-base leading-relaxed">
                    {lead.remarks || "No remarks provided."}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewLeadPage;