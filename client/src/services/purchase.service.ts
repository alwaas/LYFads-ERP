import api from "./api";
import { vendorService } from "./vendor.service";
import type { Vendor } from "../types/vendor";

export interface Purchase {
  id: string;
  purchaseDate: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  referenceNo?: string;
  description: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE";

export interface CreatePurchaseDto {
  purchaseDate: string;
  vendorId: string;
  referenceNo?: string;
  description: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface UpdatePurchaseDto {
  purchaseDate?: string;
  vendorId?: string;
  referenceNo?: string;
  description?: string;
  subtotal?: string;
  tax?: string;
  total?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface PurchaseQueryParams {
  dateFrom?: string;
  dateTo?: string;
  vendorId?: string;
  method?: PaymentMethod;
  search?: string;
}

export const purchaseService = {
  getAllPurchases: async (params?: PurchaseQueryParams) => {
    const response = await api.get("/purchases", { params });
    return response.data.data;
  },

  getPurchaseById: async (id: string): Promise<Purchase> => {
    const response = await api.get(`/purchases/${id}`);
    return response.data.data || response.data;
  },

  createPurchase: async (dto: CreatePurchaseDto): Promise<Purchase> => {
    const response = await api.post("/purchases", dto);
    return response.data.data || response.data;
  },

  updatePurchase: async (id: string, dto: UpdatePurchaseDto): Promise<Purchase> => {
    const response = await api.patch(`/purchases/${id}`, dto);
    return response.data.data || response.data;
  },

  deletePurchase: async (id: string): Promise<void> => {
    await api.delete(`/purchases/${id}`);
  },
};

export const getActiveVendors = async (): Promise<Vendor[]> => {
  const response = await vendorService.getAllVendors({ limit: 100, isActive: true });
  return response.data;
};
