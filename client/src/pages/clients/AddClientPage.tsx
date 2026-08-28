import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import ClientForm, { type ClientFormData } from "../../components/clients/ClientForm";
import { createClient } from "../../services/client.service";

import { mapServerValidationErrors } from "../../features/validation/errors";

function AddClientPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (values: ClientFormData) => {
    setServerErrors({});
    try {
      setLoading(true);
      await createClient(values);
      toast.success("Client created successfully.");
      navigate("/clients");
    } catch (error: unknown) {
      console.error(error);
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error((error as any)?.response?.data?.message ?? "Failed to create client.");
      }
    } finally {
      setLoading(false);
    }
  };

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
                Add New Client
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Register a new client into the system.
              </p>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-8">
            <ClientForm defaultValues={undefined} loading={loading} onSubmit={handleSubmit} serverErrors={serverErrors} />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default AddClientPage;
