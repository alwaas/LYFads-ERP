import api from "./api";

/* ===========================
   GET ALL TASKS
=========================== */
export const getTasks = async () => {
  const response = await api.get("/tasks");
  return response.data;
};

/* ===========================
   GET SINGLE TASK
=========================== */
export const getTask = async (id: string) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

/* ===========================
   CREATE TASK
=========================== */
export const createTask = async (data: any) => {
  const response = await api.post("/tasks", data);
  return response.data;
};

/* ===========================
   UPDATE TASK
=========================== */
export const updateTask = async (
  id: string,
  data: any
) => {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data;
};

/* ===========================
   DELETE TASK
=========================== */
export const deleteTask = async (id: string) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};