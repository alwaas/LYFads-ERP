import { useEffect, useState } from "react";
import { getProjects } from "../../services/project.service";

type Project = {
  id: string;
  name: string;
  status: string;
  client?: {
    companyName?: string;
    fullName?: string;
  };
};

function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const list = await getProjects();
      setProjects(list.slice(0, 5));

       } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-semibold mb-5">
        Recent Projects
      </h2>

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
                  Status
                </th>

                <th className="text-left py-3">
                  Client
                </th>

              </tr>

            </thead>

            <tbody>

              {projects.map((project) => (

                <tr
                  key={project.id}
                  className="border-b"
                >

                  <td className="py-3">
                    {project.name}
                  </td>

                  <td className="py-3">

                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">

                      {project.status}

                    </span>

                  </td>

                  <td className="py-3">

                    {project.client?.companyName ??
                      project.client?.fullName ??
                      "-"}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default RecentProjects;