import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import ClientForm, { type ClientFormData } from "../../components/clients/ClientForm";
import { getClient, updateClient } from "../../services/client.service";

function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<ClientFormData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadClient(id);
    }
  }, [id]);

  const loadClient = async (clientId: string) => {
    try {
      setLoading(true);
      const data = await getClient(clientId);
      setClient(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load client details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: ClientFormData) => {
    if (!id) return;

    try {
      setSubmitting(true);

      const payload = {
        companyName: values.companyName,
        email: values.email,
        phone: values.phone,
        website: values.website,
        gstNumber: values.gstNumber,
        address: values.address,
        city: values.city,
        state: values.state,
        country: values.country,
        pincode: values.pincode,
      };

      await updateClient(id, payload);

      toast.success("Client updated successfully.");
      navigate("/clients");
    } catch (error: any) {
      console.error("Update Client Error:", error);

      toast.error(
        error?.response?.data?.message ??
        "Failed to update client."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading client details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex items-center gap-4">
            <button
              onClick={() => navigate("/clients")}
              className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Edit Client
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Update existing client details.
              </p>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-8">
            <ClientForm 
              defaultValues={client} 
              loading={submitting} 
              onSubmit={handleSubmit} 
            />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EditClientPage;