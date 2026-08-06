import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import LeadForm, {
  type LeadFormData,
} from "../../components/crm/LeadForm";

import {
  getLead,
  updateLead,
} from "../../services/crm.service";

function EditLeadPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState<LeadFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadLead(id);
    }
  }, [id]);

  const loadLead = async (leadId: string) => {
    try {
      setLoading(true);
      const data = await getLead(leadId);
      setLead(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load lead details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: LeadFormData) => {
    if (!id) return;

    try {
      setSubmitting(true);
      await updateLead(id, values);
      toast.success("Lead updated successfully.");
      navigate("/crm");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ??
          "Failed to update lead.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full flex justify-center items-center h-64">
          <p className="text-slate-500 text-base animate-pulse">Loading lead details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Outer container for full width and correct padding on all devices */}
      <div className="w-full max-w-full px-2 sm:px-4 md:px-6 py-4 space-y-6">

        {/* Top Header with Back Button */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 sm:p-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/crm")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs"
              title="Back to CRM"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Edit Lead
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Update existing business lead information.
              </p>
            </div>
          </div>
        </div>

        {/* Lead Form Container */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-8">
          <LeadForm
            initialValues={lead || undefined}
            loading={submitting}
            onSubmit={handleSubmit}
          />
        </div>

      </div>
    </DashboardLayout>
  );
}

export default EditLeadPage;