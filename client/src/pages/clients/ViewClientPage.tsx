import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";

import { getClient } from "../../services/client.service";

import type { Client } from "../../types/client";

function ViewClientPage() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [client, setClient] = useState<Client | null>(null);

  const [loading, setLoading] = useState(true);

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

      alert("Failed to load client.");

      navigate("/clients");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          Loading Client...
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="p-6">
          Client not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Client Details
          </h1>

          <button
            onClick={() => navigate("/clients")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back
          </button>

        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="text-gray-500">
                Company Name
              </p>

              <p className="font-semibold">
                {client.companyName}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Contact Person
              </p>

              <p className="font-semibold">
                {client.contactPerson}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Email
              </p>

              <p className="font-semibold">
                {client.email}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Phone
              </p>

              <p className="font-semibold">
                {client.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                GST Number
              </p>

              <p className="font-semibold">
                {client.gstNumber || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Website
              </p>

              <p className="font-semibold">
                {client.website || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Address
              </p>

              <p className="font-semibold">
                {client.address || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                City
              </p>

              <p className="font-semibold">
                {client.city || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                State
              </p>

              <p className="font-semibold">
                {client.state || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Country
              </p>

              <p className="font-semibold">
                {client.country || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Pincode
              </p>

              <p className="font-semibold">
                {client.pincode || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Status
              </p>

              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  client.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {client.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default ViewClientPage;