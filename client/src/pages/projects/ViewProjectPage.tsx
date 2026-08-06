import KanbanBoard from "../../components/kanban/KanbanBoard";
import toast from "react-hot-toast";

import {
  getKanbanBoard,
  moveTask,
} from "../../services/kanban.service";

import type {
  KanbanTask,
  KanbanTaskStatus,
} from "../../types/kanban";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import ProjectCard from "../../components/projects/ProjectCard";
import ProjectTimeline from "../../components/projects/ProjectTimeline";

import { getProject } from "../../services/project.service";
import { getProjectTimeline } from "../../services/projectTimeline.service";

import type { Project } from "../../types/project";
import type { ProjectTimeline as Timeline } from "../../types/projectTimeline";

function ViewProjectPage() {
  const { id } = useParams();

  const [project, setProject] =
    useState<Project | null>(null);
    const [tasks, setTasks] =
    useState<KanbanTask[]>([]);

  const [timeline, setTimeline] =
    useState<Timeline | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  const loadProject = async (projectId: string) => {
    try {
      const projectData = await getProject(projectId);
      setProject(projectData);
      const board =
      await getKanbanBoard(projectId);

      setTasks(board);

      const timelineData =
        await getProjectTimeline(projectId);

      setTimeline(timelineData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (
    taskId: string,
    status: KanbanTaskStatus
  ) => {
    try {
      await moveTask(taskId, {
        status,
      });

      if (id) {
        const board = await getKanbanBoard(id);
        setTasks(board);
      }

      toast.success("Task moved successfully.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to move task.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Project Details
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : project ? (
          <>
            <ProjectCard project={project} />
            <div className="pt-8">

              <h2 className="text-2xl font-bold mb-5">
                Project Kanban Board
              </h2>

              <KanbanBoard
                tasks={tasks}
                onMove={handleMove}
              />

            </div>

            {timeline && (
              <ProjectTimeline timeline={timeline} />
            )}
          </>
        ) : (
          <div className="text-red-500">
            Project not found.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ViewProjectPage;