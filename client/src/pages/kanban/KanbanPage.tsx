import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import toast from "react-hot-toast";

import KanbanBoard from "../../components/kanban/KanbanBoard";
import { projectService } from "../../services/project.service";
import { getKanbanBoard, moveTask } from "../../services/kanban.service";
import type { KanbanTask, KanbanTaskStatus } from "../../types/kanban";
import type { Project } from "../../types/project";

function KanbanPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Fetch all projects for selection
  const { data: rawProjects, isLoading: projectsLoading } = useQuery<any>({
    queryKey: ["projects-kanban"],
    queryFn: () => projectService.getAllProjects(1, 100),
  });

  const projects: Project[] = Array.isArray(rawProjects)
    ? rawProjects
    : (rawProjects?.data || []);

  // Determine active project ID
  useEffect(() => {
    if (projectId && projectId !== ":projectId") {
      setSelectedProjectId(projectId);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projectId, projects, selectedProjectId]);

  const loadBoard = useCallback(async (pId: string) => {
    if (!pId || pId === ":projectId") {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getKanbanBoard(pId);
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load kanban board.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadBoard(selectedProjectId);
    } else if (!projectsLoading && projects.length === 0) {
      setLoading(false);
    }
  }, [loadBoard, selectedProjectId, projectsLoading, projects.length]);

  const handleProjectChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    navigate(`/projects/${newProjectId}/kanban`, { replace: true });
  };

  const handleMove = async (
    taskId: string,
    status: KanbanTaskStatus
  ) => {
    try {
      await moveTask(taskId, { status });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task
        )
      );

      toast.success("Task moved.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to move task.");
    }
  };

  if (projectsLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kanban Board
          </h1>
          <p className="text-slate-500 mt-1">
            Drag & Drop Tasks
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No Projects Found</h3>
          <p className="mt-1 text-sm text-slate-500">
            You need at least one project to view tasks on the Kanban board.
          </p>
          <div className="mt-6">
            <Link
              to="/projects/add"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              <Plus size={16} />
              Create Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kanban Board
          </h1>
          <p className="text-slate-500 mt-1">
            Drag & Drop Tasks
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="kanban-project-select" className="text-sm font-medium text-slate-700 whitespace-nowrap">
            Project:
          </label>
          <select
            id="kanban-project-select"
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name} ({proj.projectCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onMove={handleMove}
        />
      )}
    </div>
  );
}

export default KanbanPage;