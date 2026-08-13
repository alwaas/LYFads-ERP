import api from "./api";
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto } from "../types/invoice";

export const invoiceService = {
  getAllInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get("/invoice");
    // Backend returns direct array, not wrapped in {data: []}
    return Array.isArray(response.data) ? response.data : response.data.data || [];
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
