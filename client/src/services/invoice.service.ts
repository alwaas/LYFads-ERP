import api from "./api";
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, ARSummary } from "../types/invoice";

export const invoiceService = {
  getARSummary: async (): Promise<ARSummary> => {
    const response = await api.get("/invoice/summary/ar");
    return response.data.data || response.data;
  },

  getAllInvoices: async (page = 1, limit = 10, status?: string, search?: string) => {
    const params: Record<string, string | number> = { page, limit };
    if (status && status !== "all") params.status = status;
    if (search) params.search = search;
    const response = await api.get("/invoice", { params });
    return response.data.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoice/${id}`);
    return response.data.data || response.data;
  },

  createInvoice: async (dto: CreateInvoiceDto): Promise<Invoice> => {
    const response = await api.post("/invoice", dto);
    return response.data.data || response.data;
  },

  updateInvoice: async (id: string, dto: UpdateInvoiceDto): Promise<Invoice> => {
    const response = await api.patch(`/invoice/${id}`, dto);
    return response.data.data || response.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await api.delete(`/invoice/${id}`);
  },
};
