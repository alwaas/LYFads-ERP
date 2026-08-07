import api from "./api";

/* ===========================
   GET ALL TASKS
=========================== */
export const getTasks = async () => {
  const response = await api.get("/tasks");
  return response.data.data.data;
};

/* ===========================
   GET SINGLE TASK
=========================== */
export const getTask = async (id: string) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data.data;
};

/* ===========================
   CREATE TASK
=========================== */
export const createTask = async (data: any) => {
  const response = await api.post("/tasks", data);
  return response.data.data;
};

/* ===========================
   UPDATE TASK
=========================== */
export const updateTask = async (
  id: string,
  data: any
  ) => {
  const payload = {
    taskCode: data.taskCode,
    title: data.title,
    description: data.description || "",
    projectId: data.projectId,
    employeeId: data.employeeId || undefined,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate || undefined,
    estimatedHours:
      data.estimatedHours !== undefined &&
      data.estimatedHours !== null &&
      !Number.isNaN(Number(data.estimatedHours))
        ? Number(data.estimatedHours)
        : undefined,
  };

  console.log("PATCH /tasks PAYLOAD:", payload);

  const response = await api.patch(
    `/tasks/${id}`,
    payload
  );

  return response.data.data;
};

/* ===========================
   DELETE TASK
=========================== */
export const deleteTask = async (id: string) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data.data;
};