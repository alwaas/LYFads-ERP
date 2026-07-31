import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import {
  deleteLead,
  getLead,
} from "../../services/crm.service";

import type { Lead } from "../../types/lead";

function ViewLeadPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead>();

  const [loading, setLoading] = useState(true);

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

  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm("Delete this lead?")) {
      return;
    }

    try {
      await deleteLead(id);

      toast.success("Lead deleted.");

      navigate("/crm");
    } catch (error) {
      console.error(error);

      toast.error("Delete failed.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        Loading...
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        Lead not found.
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Lead Details
          </h1>

          <div className="flex gap-3">

            <Link
              to={`/crm/edit/${lead.id}`}
              className="bg-amber-500 text-white px-5 py-2 rounded-lg"
            >
              Edit
            </Link>

            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-5 py-2 rounded-lg"
            >
              Delete
            </button>

          </div>

        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">

          <div>

            <p className="text-gray-500">
              Company
            </p>

            <h2 className="text-xl font-semibold">
              {lead.companyName}
            </h2>

          </div>

          <div>

            <p className="text-gray-500">
              Contact Person
            </p>

            <p>{lead.contactPerson}</p>

          </div>

          <div>

            <p className="text-gray-500">
              Email
            </p>

            <p>{lead.email || "-"}</p>

          </div>

          <div>

            <p className="text-gray-500">
              Phone
            </p>

            <p>{lead.phone || "-"}</p>

          </div>

          <div>

            <p className="text-gray-500">
              Status
            </p>

            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">

              {lead.status}

            </span>

          </div>

          <div>

            <p className="text-gray-500">
              Source
            </p>

            <p>{lead.source || "-"}</p>

          </div>

          <div>

            <p className="text-gray-500">
              Estimated Value
            </p>

            <p>
              ₹
              {Number(
                lead.estimatedValue ?? 0,
              ).toLocaleString()}
            </p>

          </div>

          <div>

            <p className="text-gray-500">
              Remarks
            </p>

            <p>{lead.remarks || "-"}</p>

          </div>

          <div>

            <p className="text-gray-500">
              Created
            </p>

            <p>
              {new Date(
                lead.createdAt,
              ).toLocaleString()}
            </p>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default ViewLeadPage;