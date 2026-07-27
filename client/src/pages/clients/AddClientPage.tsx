import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import ClientForm, {
  type ClientFormData,
} from "../../components/clients/ClientForm";

import { createClient } from "../../services/client.service";

function AddClientPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    data: ClientFormData
  ) => {
    try {
      setLoading(true);

      await createClient(data);

      toast.success(
        "Client created successfully."
      );

      navigate("/clients");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to create client."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Add Client
        </h1>

        <ClientForm
          loading={loading}
          onSubmit={handleSubmit}
        />

      </div>

    </DashboardLayout>
  );
}

export default AddClientPage;