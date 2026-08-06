import { Link } from "react-router-dom";
import {
  Eye,
  Pencil,
  Trash2,
  Building2,
  User,
} from "lucide-react";

import type { Lead } from "../../types/lead";

type Props = {
  leads: Lead[];
  onDelete: (id: string) => void;
};

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-cyan-100 text-cyan-700",
  QUALIFIED: "bg-green-100 text-green-700",
  PROPOSAL: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
};

const sourceColors: Record<string, string> = {
  WEBSITE: "bg-blue-100 text-blue-700",
  FACEBOOK: "bg-indigo-100 text-indigo-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
  LINKEDIN: "bg-sky-100 text-sky-700",
  REFERRAL: "bg-green-100 text-green-700",
  OTHER: "bg-slate-100 text-slate-700",
};

function LeadTable({
  leads,
  onDelete,
}: Props) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
        <Building2
          className="mx-auto mb-4 text-slate-300"
          size={44}
        />

        <h2 className="text-lg font-semibold text-slate-700">
          No Leads Found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Create your first CRM lead.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">

      <table className="min-w-full">

        <thead className="bg-slate-50">

          <tr className="text-sm text-slate-700">

            <th className="px-5 py-4 text-left font-semibold">
              Company
            </th>

            <th className="px-5 py-4 text-left font-semibold">
              Email
            </th>

            <th className="px-5 py-4 text-left font-semibold">
              Phone
            </th>

            <th className="px-5 py-4 text-left font-semibold">
              Source
            </th>

            <th className="px-5 py-4 text-left font-semibold">
              Status
            </th>

            <td className="px-5 py-4 text-left font-semibold">
              Estimated Value
            </td>

            <th className="px-5 py-4 text-left font-semibold">
              Created
            </th>

            <th className="px-5 py-4 text-center font-semibold">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {leads.map((lead) => (

            <tr
              key={lead.id}
              className="border-t transition hover:bg-blue-50"
            >

              <td className="px-5 py-4">

                <div className="font-semibold text-slate-800">
                  {lead.companyName}
                </div>

                <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">

                  <User size={14} />

                  {lead.contactPerson}

                </div>

              </td>

              <td className="px-5 py-4 text-slate-600">
                {lead.email || "-"}
              </td>

              <td className="px-5 py-4 text-slate-600">
                {lead.phone || "-"}
              </td>

              <td className="px-5 py-4">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    sourceColors[lead.source] ??
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {lead.source}
                </span>

              </td>

              <td className="px-5 py-4">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusColors[lead.status] ??
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {lead.status}
                </span>

              </td>

              <td className="px-5 py-4 text-xs text-slate-900">

                ₹
                {Number(
                  lead.estimatedValue ?? 0,
                ).toLocaleString("en-IN")}

              </td>

              <td className="px-5 py-4 text-xs text-slate-900">
                {new Date(
                  lead.createdAt,
                ).toLocaleDateString()}
              </td>

              <td className="px-5 py-4">

                <div className="flex justify-center gap-2">

                  <Link
                    to={`/crm/view/${lead.id}`}
                    className="rounded-lg bg-slate-100 p-2 transition hover:bg-slate-200"
                    title="View"
                  >
                    <Eye size={18} />
                  </Link>

                  <Link
                    to={`/crm/edit/${lead.id}`}
                    className="rounded-lg bg-amber-100 p-2 transition hover:bg-amber-200"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </Link>

                  <button
                    onClick={() => onDelete(lead.id)}
                    className="rounded-lg bg-red-100 p-2 transition hover:bg-red-200"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default LeadTable;