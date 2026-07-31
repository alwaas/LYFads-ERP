import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import LeadForm, {
  type LeadFormData,
} from "../../components/crm/LeadForm";

import {
  getLead,
  updateLead,
} from "../../services/crm.service";

import type { Lead } from "../../types/lead";

function EditLeadPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead>();

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (
    values: LeadFormData,
  ) => {
    if (!id) return;

    try {
      setSaving(true);

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
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Edit Lead
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <LeadForm
            initialValues={lead}
            loading={saving}
            onSubmit={handleSubmit}
          />
        )}

      </div>

    </DashboardLayout>
  );
}

export default EditLeadPage;