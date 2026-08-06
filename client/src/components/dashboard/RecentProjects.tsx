import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getRecentProjects } from "../../services/dashboard.service";

type Project = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  endDate?: string;
  client?: {
    companyName: string;
  };
};

function statusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "ACTIVE":
      return "bg-blue-100 text-blue-700";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const response = await getRecentProjects();

      setProjects(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <div className="flex justify-between items-center mb-5">

        <h2 className="text-xl font-semibold">
          Recent Projects
        </h2>

        <Link
          to="/projects"
          className="text-blue-600 text-sm hover:underline"
        >
          View All
        </Link>

      </div>

      {loading ? (

        <p>Loading...</p>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left py-3">
                  Project
                </th>

                <th className="text-left py-3">
                  Client
                </th>

                <th className="text-left py-3">
                  Status
                </th>

                <th className="text-left py-3">
                  Deadline
                </th>

              </tr>

            </thead>

            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-10 text-gray-500"
                  >
                    No Recent Projects
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3">
                      {project.name}
                    </td>

                    <td>
                      {project.client?.companyName ?? "-"}
                    </td>

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td>
                      {project.endDate
                        ? new Date(
                            project.endDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}