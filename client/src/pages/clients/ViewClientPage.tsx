import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Building2, User, Mail, Phone, Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getClient, deleteClient } from "../../services/client.service";
import type { Client } from "../../types/client";

function ViewClientPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadClient(id);
  }, [id]);

  const loadClient = async (clientId: string) => {
    try {
      const data = await getClient(clientId);
      setClient(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load client details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this client?")) return;

    try {
      await deleteClient(id);
      toast.success("Client deleted successfully.");
      navigate("/clients");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete client.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading client details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-lg font-medium">Client not found.</p>
            <Link
              to="/clients"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium text-sm"
            >
              <ArrowLeft size={18} /> Back to Clients
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          
          {/* Header */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/clients"
                className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Client Details
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/clients/edit/${client.id}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Pencil size={16} /> Edit
              </Link>

              <button
                onClick={handleDelete}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Building2 size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Client Name</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                  {client.companyName || "-"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><Mail size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email Address</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5 break-all">{client.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><Phone size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.phone || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Company</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.companyName || "-"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">GST Number</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.gstNumber || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Website</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.website || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Address</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.address || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">City</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.city || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">State</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.state || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Country</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.country || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><User size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Pincode</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{client.pincode || "-"}</p>
                </div>
              </div>
              
            </div>
          </div>

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewClientPage;