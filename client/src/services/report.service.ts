import api from "./api";
import type {
  InventoryReport,
  ProfitabilityReport,
  ExpenseReport,
  PurchaseReport,
  VendorReport,
  PayablesReport,
} from "../types/report";

export const getInventoryReport = async (): Promise<InventoryReport> => {
  const { data } = await api.get("/reports/inventory");
  return data.data as InventoryReport;
};

export const getProfitabilityReport = async (params?: { dateFrom?: string; dateTo?: string }): Promise<ProfitabilityReport> => {
  const { data } = await api.get("/reports/profitability", { params });
  return data.data as ProfitabilityReport;
};

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

export const getPayablesReport = async (params?: { dateFrom?: string; dateTo?: string }): Promise<PayablesReport> => {
  const { data } = await api.get("/reports/payables", { params });
  return data.data as PayablesReport;
};

export const getCustomerReport = async (params?: { dateFrom?: string; dateTo?: string; clientId?: string; projectId?: string; status?: string }) => {
  const { data } = await api.get("/reports/customers", { params });
  return data.data;
};

export const getExpenseReport = async (params?: { dateFrom?: string; dateTo?: string; category?: string; search?: string }): Promise<ExpenseReport> => {
  const { data } = await api.get("/reports/expenses", { params });
  return data.data as ExpenseReport;
};

export const getPurchaseReport = async (params?: { dateFrom?: string; dateTo?: string; vendorId?: string; search?: string }): Promise<PurchaseReport> => {
  const { data } = await api.get("/reports/purchases", { params });
  return data.data as PurchaseReport;
};

export const getVendorReport = async (params?: { dateFrom?: string; dateTo?: string }): Promise<VendorReport> => {
  const { data } = await api.get("/reports/vendors", { params });
  return data.data as VendorReport;
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
