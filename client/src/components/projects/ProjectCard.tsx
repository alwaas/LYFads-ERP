import { Link } from "react-router-dom";

import type { Project } from "../../types/project";

type Props = {
  project: Project;
};

function ProjectCard({ project }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

        <div>
          <h2 className="text-2xl font-bold">
            {project.name}
          </h2>

          <p className="text-gray-500">
            {project.projectCode}
          </p>
        </div>

        <Link
          to={`/projects/${project.id}/kanban`}
          className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-5 py-2 text-white font-medium hover:bg-purple-700 transition"
        >
          Kanban Board
        </Link>

      </div>

      <div className="grid md:grid-cols-2 gap-5">

        <div>
          <p className="text-gray-500">
            Client
          </p>

          <p className="font-semibold">
            {project.client.companyName}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Manager
          </p>

          <p className="font-semibold">
            {project.manager?.fullName ?? "-"}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Status
          </p>

          <p className="font-semibold">
            {project.status}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Priority
          </p>

          <p className="font-semibold">
            {project.priority}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Budget
          </p>

          <p className="font-semibold">
            {project.budget ?? "-"}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Progress
          </p>

          <p className="font-semibold">
            {project.progress}%
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Start Date
          </p>

          <p>
            {project.startDate
              ? new Date(
                  project.startDate
                ).toLocaleDateString()
              : "-"}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            End Date
          </p>

          <p>
            {project.endDate
              ? new Date(
                  project.endDate
                ).toLocaleDateString()
              : "-"}
          </p>
        </div>

      </div>

      <div>

        <p className="text-gray-500 mb-2">
          Description
        </p>

        <p>
          {project.description || "-"}
        </p>

      </div>

    </div>
  );
}

export default ProjectCard;