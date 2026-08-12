import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Search, Calendar } from "lucide-react";

import PageLoader from "../../components/common/PageLoader";
import { getProjectTimeline } from "../../services/projectTimeline.service";
import { projectService } from "../../services/project.service";
import type { Project } from "../../types/project";
import type { ProjectTimeline } from "../../types/projectTimeline";

const ProjectTimelinePage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => projectService.getAllProjects(),
  });

  const { data: timeline, isLoading: timelineLoading, isError } = useQuery<ProjectTimeline>({
    queryKey: ["project-timeline", selectedProjectId],
    queryFn: () => getProjectTimeline(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.projectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Project Timeline
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            View milestones and tasks across projects
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {projectsLoading ? (
                <div className="text-center py-4 text-sm text-slate-500">
                  Loading projects...
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-4 text-sm text-slate-500">
                  No projects found
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedProjectId === project.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900">
                      {project.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {project.projectCode}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : "No start date"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {timelineLoading ? (
            <PageLoader />
          ) : !selectedProjectId ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <GitBranch className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Select a Project
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Choose a project from the list to view its timeline
              </p>
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <h2 className="text-sm font-semibold text-red-800">
                Unable to load timeline
              </h2>
              <p className="mt-1 text-sm text-red-600">
                The project timeline could not be loaded.
              </p>
            </div>
          ) : timeline ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {timeline.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {timeline.projectCode} • {timeline.status}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Milestones</h3>
                  {timeline.milestones.length === 0 ? (
                    <p className="text-gray-500 text-sm">No milestones found.</p>
                  ) : (
                    <div className="space-y-3">
                      {timeline.milestones.map((m) => (
                        <div
                          key={m.id}
                          className="border rounded-lg p-3"
                        >
                          <p className="font-semibold text-sm">{m.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Deadline: {m.deadline ? new Date(m.deadline).toLocaleDateString() : "-"}
                          </p>
                          <p className="text-xs mt-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                              m.completedAt
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {m.completedAt ? "Completed" : "Pending"}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Tasks</h3>
                  {timeline.tasks.length === 0 ? (
                    <p className="text-gray-500 text-sm">No tasks found.</p>
                  ) : (
                    <div className="space-y-3">
                      {timeline.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="border rounded-lg p-3"
                        >
                          <p className="font-semibold text-sm">{task.title}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-gray-500">Status: {task.status}</span>
                            <span className="text-xs text-gray-500">Priority: {task.priority}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned: {task.employee?.user.fullName ?? "-"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProjectTimelinePage;