import api from "./api";
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponse,
} from "../types/payment";

const extractPaymentData = (payload: unknown): Payment[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as Record<string, unknown>;

  const candidates: unknown[] = [
    response.data,
    response,
  ];

  if (response.data && typeof response.data === "object") {
    const nested = response.data as Record<string, unknown>;

    candidates.push(
      nested.data,
      nested.items,
      nested.results,
    );
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Payment[];
    }
  }

  return [];
};

export const paymentService = {
  getAllPayments: async (): Promise<Payment[]> => {
    const response = await api.get("/payments");
    return extractPaymentData(response.data);
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

  getPaymentsResponse: async (): Promise<PaymentResponse> => {
    const response = await api.get("/payments");
    const items = extractPaymentData(response.data);

    return {
      data: items,
      total: items.length,
      page: 1,
      limit: items.length,
    };
  },
};