import api from "./api";

import type {
  DailyWorkReport,
  CreateDailyWorkReportDto,
} from "../types/daily-work-report";

/* ===========================
   Get All Reports
=========================== */

export const getDailyWorkReports = async (): Promise<DailyWorkReport[]> => {
  const response = await api.get("/daily-work-reports");

  return response.data.data.data;
};

/* ===========================
   Get Report By ID
=========================== */

export const getDailyWorkReportById = async (
  id: string
): Promise<DailyWorkReport> => {
  const response = await api.get(
    `/daily-work-reports/${id}`
  );

  return response.data.data;
};

/* ===========================
   Create Report
=========================== */

export const createDailyWorkReport = async (
  data: CreateDailyWorkReportDto
) => {
  const response = await api.post(
    "/daily-work-reports",
    data
  );

  return response.data;
};

/* ===========================
   Update Report
=========================== */

export const updateDailyWorkReport = async (
  id: string,
  data: Partial<CreateDailyWorkReportDto>
) => {
  const response = await api.patch(
    `/daily-work-reports/${id}`,
    data
  );

  return response.data;
};

/* ===========================
   Delete Report
=========================== */

export const deleteDailyWorkReport = async (
  id: string
) => {
  const response = await api.delete(
    `/daily-work-reports/${id}`
  );

  return response.data;
};