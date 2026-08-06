import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import LeadForm, {
  type LeadFormData,
} from "../../components/crm/LeadForm";

import { createLead } from "../../services/crm.service";

function AddLeadPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LeadFormData) => {
    try {
      setLoading(true);
      await createLead(values);
      toast.success("Lead created successfully.");
      navigate("/crm");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ??
          "Failed to create lead.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">

          {/* Top Header with Back Button */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex items-center gap-4">
            <button
              onClick={() => navigate("/crm")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back to CRM"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Add New Lead
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Create a new business lead in your CRM.
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-8">
            <LeadForm
              loading={loading}
              onSubmit={handleSubmit}
            />
          </div>

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default AddLeadPage;