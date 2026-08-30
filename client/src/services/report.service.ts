import api from "./api";

export const getDashboardReport = async (params?: { dateFrom?: string; dateTo?: string }) => {
  const { data } = await api.get("/reports/dashboard", { params });
  return data.data;
};

export const getSalesReport = async (params?: { dateFrom?: string; dateTo?: string; clientId?: string; projectId?: string; status?: string }) => {
  const { data } = await api.get("/reports/sales", { params });
  return data.data;
};

export const getReceivablesReport = async () => {
  const { data } = await api.get("/reports/receivables");
  return data.data;
};

export const getCustomerReport = async (params?: { dateFrom?: string; dateTo?: string; clientId?: string; projectId?: string; status?: string }) => {
  const { data } = await api.get("/reports/customers", { params });
  return data.data;
};

export const getExpenseReport = async (params?: { dateFrom?: string; dateTo?: string }) => {
  const { data } = await api.get("/reports/expenses", { params });
  return data.data;
};

export const getPurchaseReport = async (params?: { dateFrom?: string; dateTo?: string }) => {
  const { data } = await api.get("/reports/purchases", { params });
  return data.data;
};

export const getVendorReport = async (params?: { dateFrom?: string; dateTo?: string }) => {
  const { data } = await api.get("/reports/vendors", { params });
  return data.data;
};

export const getProfitabilityReport = async (params?: { dateFrom?: string; dateTo?: string }) => {
  const { data } = await api.get("/reports/profitability", { params });
  return data.data;
};

export const getEmployeeDirectoryReport = async () => {
  const { data } = await api.get("/reports/employees");
  return data.data;
};

export const getAttendanceSummaryReport = async (params?: { month?: string; year?: string }) => {
  const { data } = await api.get("/reports/attendance-summary", { params });
  return data.data;
};

export const getLeaveReport = async (params?: { month?: string; year?: string }) => {
  const { data } = await api.get("/reports/leave-report", { params });
  return data.data;
};

export const getPayrollSummaryReport = async (params?: { month?: string; year?: string }) => {
  const { data } = await api.get("/reports/payroll-summary", { params });
  return data.data;
};

export const exportReport = async (reportType: string, format: 'csv' | 'excel' | 'pdf', params?: any) => {
  const response = await api.get(`/reports/export/${reportType}/${format}`, {
    params,
    responseType: 'blob',
  });
  return response.data;
};
