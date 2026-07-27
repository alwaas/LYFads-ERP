import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import ClientTable from "../../components/clients/ClientTable";
import ClientFilters from "../../components/clients/ClientFilters";

import { getClients } from "../../services/client.service";
import { deleteClient } from "../../services/client.service";
import toast from "react-hot-toast";

import type { Client } from "../../types/client";

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();

      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const keyword = search.toLowerCase();

    return clients.filter((client) => {
      return (
        client.companyName
          .toLowerCase()
          .includes(keyword) ||
        client.contactPerson
          .toLowerCase()
          .includes(keyword) ||
        client.email
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [clients, search]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Delete this client?"
    );

    if (!confirmDelete) return;

    try {
      await deleteClient(id);

      toast.success("Client deleted successfully.");

      loadClients();
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
        "Failed to delete client."
      );
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Clients
          </h1>

          <button
            onClick={() => window.location.href = "/clients/add"}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Client
          </button>

        </div>

        <ClientFilters
          search={search}
          setSearch={setSearch}
        />

        {loading ? (
          <div>
            Loading Clients...
          </div>
        ) : (
          <ClientTable
            clients={filteredClients}
            onDelete={handleDelete}
          />
        )}

      </div>

    </DashboardLayout>
  );
}

export default ClientsPage;