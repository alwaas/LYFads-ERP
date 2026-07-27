import { Link } from "react-router-dom";
import type { Project } from "../../types/project";

type Props = {
  projects: Project[];
  onDelete: (id: string) => void;
};

function ProjectTable({
  projects,
  onDelete,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-50 border-b">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Project
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Client
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Priority
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Progress
              </th>

              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {projects.length === 0 ? (

              <tr>

                <td
                  colSpan={6}
                  className="py-12 text-center text-gray-500"
                >
                  No Projects Found
                </td>

              </tr>

            ) : (

              projects.map((project) => (

                <tr
                  key={project.id}
                  className="border-b last:border-b-0 hover:bg-blue-50 transition-colors"
                >

                  <td className="px-6 py-4">

                    <p className="font-semibold text-gray-900">
                      {project.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {project.projectCode}
                    </p>

                  </td>

                  <td className="px-6 py-4">
                    {project.client.companyName}
                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : project.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-700"
                          : project.status === "ON_HOLD"
                          ? "bg-yellow-100 text-yellow-700"
                          : project.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.status}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.priority === "URGENT"
                          ? "bg-red-100 text-red-700"
                          : project.priority === "HIGH"
                          ? "bg-orange-100 text-orange-700"
                          : project.priority === "MEDIUM"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.priority}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <div className="w-28">

                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{
                            width: `${project.progress}%`,
                          }}
                        />

                      </div>

                      <p className="text-xs text-center mt-1 text-gray-600">
                        {project.progress}%
                      </p>

                    </div>

                  </td>

                  <td className="px-6 py-4">

                    <div className="flex justify-center gap-4">

                      <Link
                        to={`/projects/view/${project.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>

                      <Link
                        to={`/projects/edit/${project.id}`}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this project?"
                            )
                          ) {
                            onDelete(project.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default ProjectTable;