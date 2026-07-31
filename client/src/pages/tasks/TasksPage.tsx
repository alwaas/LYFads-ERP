import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import TaskTable from "../../components/tasks/TaskTable";
import TaskStats from "../../components/tasks/TaskStats";

import {
  getTasks,
  deleteTask,
} from "../../services/task.service";

import type { Task } from "../../types/task";

function TasksPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
  ]);

  const loadTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      await deleteTask(id);

      toast.success("Task deleted successfully.");

      loadTasks();
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ??
          "Failed to delete task."
      );
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        task.taskCode
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "" ||
        task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "" ||
        task.priority === priorityFilter;

      const matchesProject =
        projectFilter === "" ||
        task.project.id === projectFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesProject
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
  ]);

  const totalPages = Math.ceil(
    filteredTasks.length / rowsPerPage
  );

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const projects = Array.from(
    new Map(
      tasks.map((task) => [
        task.project.id,
        task.project,
      ])
    ).values()
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            Tasks
          </h1>

          <button
            onClick={() => navigate("/tasks/add")}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Task
          </button>
        </div>

        <TaskStats tasks={tasks} />

        <input
          type="text"
          placeholder="Search Tasks..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-3"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Status</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value)
            }
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Priority</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) =>
              setProjectFilter(e.target.value)
            }
            className="border rounded-lg px-4 py-2"
          >
            <option value="">
              All Projects
            </option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>

        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <TaskTable
            tasks={paginatedTasks}
            onDelete={handleDelete}
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">

            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>

            <span className="font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => page + 1)
              }
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default TasksPage;