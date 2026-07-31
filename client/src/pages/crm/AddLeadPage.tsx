import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import LeadForm, {
  type LeadFormData,
} from "../../components/crm/LeadForm";

import { createLead } from "../../services/crm.service";

function AddLeadPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    values: LeadFormData,
  ) => {
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

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Add Lead
        </h1>

        <LeadForm
          loading={loading}
          onSubmit={handleSubmit}
        />

      </div>

    </DashboardLayout>
  );
}

export default AddLeadPage;