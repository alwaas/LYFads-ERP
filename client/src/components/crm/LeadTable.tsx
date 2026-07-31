import { Link } from "react-router-dom";
import type { Lead } from "../../types/lead";

type Props = {
  leads: Lead[];
  onDelete: (id: string) => void;
};

function LeadTable({
  leads,
  onDelete,
}: Props) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No Leads Found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">

      <table className="min-w-full">

        <thead className="bg-slate-100">

          <tr>

            <th className="px-4 py-3 text-left">
              Company
            </th>

            <th className="px-4 py-3 text-left">
              Contact
            </th>

            <th className="px-4 py-3 text-left">
              Email
            </th>

            <th className="px-4 py-3 text-left">
              Status
            </th>

            <th className="px-4 py-3 text-left">
              Value
            </th>

            <th className="px-4 py-3 text-center">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {leads.map((lead) => (

            <tr
              key={lead.id}
              className="border-t hover:bg-slate-50"
            >

              <td className="px-4 py-3">
                {lead.companyName}
              </td>

              <td className="px-4 py-3">
                {lead.contactPerson}
              </td>

              <td className="px-4 py-3">
                {lead.email || "-"}
              </td>

              <td className="px-4 py-3">

                <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">

                  {lead.status}

                </span>

              </td>

              <td className="px-4 py-3">

                ₹
                {lead.estimatedValue?.toLocaleString() ??
                  "0"}

              </td>

              <td className="px-4 py-3">

                <div className="flex gap-2 justify-center">

                  <Link
                    to={`/crm/${lead.id}`}
                    className="px-3 py-1 bg-slate-700 text-white rounded"
                  >
                    View
                  </Link>

                  <Link
                    to={`/crm/edit/${lead.id}`}
                    className="px-3 py-1 bg-amber-500 text-white rounded"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => onDelete(lead.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
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