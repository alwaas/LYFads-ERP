import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import ClientForm, {
  type ClientFormData,
} from "../../components/clients/ClientForm";

import {
  getClient,
  updateClient,
} from "../../services/client.service";

import type { Client } from "../../types/client";

function EditClientPage() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [loading, setLoading] = useState(false);

  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      if (!id) return;

      const data = await getClient(id);

      setClient(data);
    } catch (error) {
      console.error(error);

      toast.error("Failed to load client.");

      navigate("/clients");
    }
  };

  const handleSubmit = async (
    data: ClientFormData
  ) => {
    try {
      if (!id) return;

      setLoading(true);

      await updateClient(id, data);

      toast.success("Client updated successfully.");

      navigate("/clients");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to update client."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
    return (
      <DashboardLayout>
        <div className="p-6">
          Loading Client...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Edit Client
        </h1>

        <ClientForm
          loading={loading}
          onSubmit={handleSubmit}
          defaultValues={{
            companyName: client.companyName,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone ?? "",
            gstNumber: client.gstNumber ?? "",
            website: client.website ?? "",
            address: client.address ?? "",
            city: client.city ?? "",
            state: client.state ?? "",
            country: client.country ?? "",
            pincode: client.pincode ?? "",
          }}
        />

      </div>

    </DashboardLayout>
  );
}

export default EditClientPage;