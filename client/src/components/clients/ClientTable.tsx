import type { Client } from "../../types/client";
import ClientAvatar from "./ClientAvatar";
import { Link } from "react-router-dom";

type Props = {
  clients: Client[];
  onDelete: (id: string) => void;
};

function ClientTable({ clients, onDelete, }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-x-auto">
      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-6 py-4 text-left">
              Company
            </th>

            <th className="px-6 py-4 text-left">
              Contact Person
            </th>

            <th className="px-6 py-4 text-left">
              Email
            </th>

            <th className="px-6 py-4 text-left">
              Phone
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-center">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {clients.length === 0 ? (

            <tr>

              <td
                colSpan={6}
                className="text-center py-10 text-gray-500"
              >
                No Clients Found
              </td>

            </tr>

          ) : (

            clients.map((client) => (

              <tr
                key={client.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="px-6 py-4">

                  <div className="flex items-center gap-3">

                    <ClientAvatar
                      name={client.companyName}
                    />

                    <div>

                      <p className="font-semibold">
                        {client.companyName}
                      </p>

                      <p className="text-sm text-gray-500">
                        {client.industry || "-"}
                      </p>

                    </div>

                  </div>

                </td>

                <td className="px-6 py-4">
                  {client.contactPerson}
                </td>

                <td className="px-6 py-4">
                  {client.email}
                </td>

                <td className="px-6 py-4">
                  {client.phone}
                </td>

                <td className="px-6 py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      client.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {client.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>

                </td>

                <td className="px-6 py-4 text-center">

                  <Link
                    to={`/clients/view/${client.id}`}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    View
                  </Link>

                  <Link
                    to={`/clients/edit/${client.id}`}
                    className="text-green-600 hover:underline mr-3"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => onDelete(client.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>
    </div>
  );
}

export default ClientTable;