import api from "./api";

import type {
  Timesheet,
  CreateTimesheetPayload,
  UpdateTimesheetPayload,
} from "../types/timesheet";

export const getTimesheets = async (): Promise<Timesheet[]> => {
  const response = await api.get("/timesheets");

  return (
    response.data.data?.data ||
    response.data.data ||
    response.data ||
    []
  );
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
): Promise<Timesheet> => {
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