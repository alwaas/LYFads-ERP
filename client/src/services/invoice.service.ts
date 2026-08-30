import api from "./api";
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, CreateInvoiceFromSalesOrderDto, AllocatePaymentDto, ARSummary } from "../types/invoice";

export const invoiceService = {
  getAllInvoices: async (searchQuery?: string, status?: string): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (status) params.set('status', status);
    const response = await api.get(`/invoice?${params.toString()}`);
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

  createInvoiceFromSalesOrder: async (salesOrderId: string, dto: CreateInvoiceFromSalesOrderDto): Promise<Invoice> => {
    const response = await api.post(`/invoice/from-sales-order/${salesOrderId}`, dto);
    return response.data.data || response.data;
  },

  updateInvoice: async (id: string, dto: UpdateInvoiceDto): Promise<Invoice> => {
    const response = await api.patch(`/invoice/${id}`, dto);
    return response.data.data || response.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await api.delete(`/invoice/${id}`);
  },

  issueInvoice: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoice/${id}/issue`);
    return response.data.data || response.data;
  },

  voidInvoice: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoice/${id}/void`);
    return response.data.data || response.data;
  },

  allocatePayment: async (invoiceId: string, dto: AllocatePaymentDto): Promise<Invoice> => {
    const response = await api.post(`/invoice/${invoiceId}/payments`, dto);
    return response.data.data || response.data;
  },

  getARSummary: async (): Promise<ARSummary> => {
    const response = await api.get("/invoice/ar-summary");
    return response.data.data || response.data;
  },
};
