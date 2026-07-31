import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import LeadTable from "../../components/crm/LeadTable";
import LeadStats from "../../components/crm/LeadStats";

import {
  getLeads,
  deleteLead,
} from "../../services/crm.service";

import type { Lead } from "../../types/lead";

function LeadsPage() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await getLeads();

      setLeads(data);
    } catch (error) {
      console.error(error);

      toast.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this lead?")) return;

    try {
      await deleteLead(id);

      toast.success("Lead deleted.");

      loadLeads();
    } catch (error) {
      console.error(error);

      toast.error("Delete failed.");
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const keyword = search.toLowerCase();

      return (
        lead.companyName.toLowerCase().includes(keyword) ||
        lead.contactPerson.toLowerCase().includes(keyword) ||
        (lead.email ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [search, leads]);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            CRM Leads
          </h1>

          <button
            onClick={() => navigate("/crm/add")}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Lead
          </button>

        </div>

        <LeadStats leads={leads} />

        <input
          className="w-full border rounded-lg px-4 py-3"
          placeholder="Search Lead..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div>Loading...</div>
        ) : (
          <LeadTable
            leads={filteredLeads}
            onDelete={handleDelete}
          />
        )}

      </div>
    </DashboardLayout>
  );
}

export default LeadsPage;