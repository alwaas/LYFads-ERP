import api from "./api";

import type {
  DailyWorkReport,
  CreateDailyWorkReportDto,
  UpdateDailyWorkReportDto,
} from "../types/daily-work-report";

// ===========================
// GET ALL REPORTS
// ===========================
export const getDailyWorkReports = async (): Promise<DailyWorkReport[]> => {
  const response = await api.get("/daily-work-reports");

  return response.data.data.data;
};

// ===========================
// GET REPORT BY ID
// ===========================
export const getDailyWorkReportById = async (
  id: string
): Promise<DailyWorkReport> => {
  const response = await api.get(`/daily-work-reports/${id}`);

  return response.data.data;
};

// ===========================
// CREATE REPORT
// ===========================
export const createDailyWorkReport = async (
  data: CreateDailyWorkReportDto
): Promise<DailyWorkReport> => {
  const response = await api.post(
    "/daily-work-reports",
    data
  );

  return response.data.data;
};

// ===========================
// UPDATE REPORT
// ===========================
export const updateDailyWorkReport = async (
  id: string,
  data: UpdateDailyWorkReportDto
): Promise<DailyWorkReport> => {
  const response = await api.patch(
    `/daily-work-reports/${id}`,
    data
  );

  return response.data.data;
};

// ===========================
// DELETE REPORT
// ===========================
export const deleteDailyWorkReport = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(
    `/daily-work-reports/${id}`
  );

  return response.data.data;
};