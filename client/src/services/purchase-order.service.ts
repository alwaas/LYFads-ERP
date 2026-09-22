import api from "./api";
import type {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
} from "../types/purchase-order";

export const purchaseOrderService = {
  getAllPurchaseOrders: async (
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
    vendorId?: string,
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;
    if (vendorId) params.vendorId = vendorId;
    const response = await api.get("/purchase-orders", { params });
    return response.data.data ?? response.data;
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.data ?? response.data;
  },

  createPurchaseOrder: async (dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const response = await api.post("/purchase-orders", dto);
    return response.data.data ?? response.data;
  },

  updatePurchaseOrder: async (id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const response = await api.patch(`/purchase-orders/${id}`, dto);
    return response.data.data ?? response.data;
  },

  deletePurchaseOrder: async (id: string): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },

  submitPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/submit`);
    return response.data.data ?? response.data;
  },

  approvePurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/approve`);
    return response.data.data ?? response.data;
  },

  cancelPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/cancel`);
    return response.data.data ?? response.data;
  },

  receivePurchaseOrder: async (
    id: string,
    dto: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/receive`, dto);
    return response.data.data ?? response.data;
  },
};
