import api from "./api";
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentAllocation,
  CreatePaymentAllocationDto,
} from "../types/payment";

export const paymentService = {
  getAllPayments: async (page = 1, limit = 10, method?: string, search?: string) => {
    const params: Record<string, string | number> = { page, limit };
    if (method && method !== "all") params.method = method;
    if (search) params.search = search;
    const response = await api.get("/payments", { params });
    return response.data.data;
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data.data || response.data;
  },

  createPayment: async (dto: CreatePaymentDto): Promise<Payment> => {
    const response = await api.post("/payments", dto);
    return response.data.data || response.data;
  },

  updatePayment: async (id: string, dto: UpdatePaymentDto): Promise<Payment> => {
    const response = await api.patch(`/payments/${id}`, dto);
    return response.data.data || response.data;
  },

  deletePayment: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },

  voidPayment: async (id: string): Promise<Payment> => {
    const response = await api.post(`/payments/${id}/void`);
    return response.data.data || response.data;
  },

  getAllPaymentAllocations: async (page = 1, limit = 10, search?: string) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    const response = await api.get("/payment-allocations", { params });
    return response.data.data;
  },

  createPaymentAllocation: async (dto: CreatePaymentAllocationDto): Promise<PaymentAllocation> => {
    const response = await api.post("/payment-allocations", dto);
    return response.data.data || response.data;
  },

  deletePaymentAllocation: async (id: string): Promise<void> => {
    await api.delete(`/payment-allocations/${id}`);
  },
};
