import api from "./api";

import type {
  Timesheet,
  CreateTimesheetPayload,
  UpdateTimesheetPayload,
} from "../types/timesheet";

export const getTimesheets = async (page = 1, limit = 10, search?: string): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  const response = await api.get("/timesheets", { params });
  return response.data.data;
};

export const getTimesheet = async (
  id: string
): Promise<Timesheet> => {
  const response = await api.get(`/timesheets/${id}`);
  return response.data.data;
};

export const createTimesheet = async (
  data: CreateTimesheetPayload
): Promise<Timesheet> => {
  const response = await api.post("/timesheets", data);
  return response.data.data;
};

export const updateTimesheet = async (
  id: string,
  data: UpdateTimesheetPayload
) => {
  const response = await api.patch(
    `/timesheets/${id}`,
    data
  );
  return response.data.data;
};

export const deleteTimesheet = async (
  id: string
) => {
  const response = await api.delete(`/timesheets/${id}`);
  return response.data.data;
};

export const submitTimesheet = async (id: string) => {
  const response = await api.post(`/timesheets/${id}/submit`);
  return response.data.data;
};

export const approveTimesheet = async (id: string) => {
  const response = await api.post(`/timesheets/${id}/approve`);
  return response.data.data;
};

export const rejectTimesheet = async (id: string, rejectionReason: string) => {
  const response = await api.post(`/timesheets/${id}/reject`, { rejectionReason });
  return response.data.data;
};

export const getEmployeeTimesheetSummary = async (
  employeeId: string
) => {
  const response = await api.get(
    `/timesheets/employee/${employeeId}/summary`
  );
  return response.data.data;
};

export const getProjectTimesheetSummary = async (
  projectId: string
) => {
  const response = await api.get(
    `/timesheets/project/${projectId}/summary`
  );
  return response.data.data;
};
