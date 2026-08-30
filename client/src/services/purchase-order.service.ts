import api from "./api";
import type {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceiveItemDto,
} from "../types/purchase-order";

export const purchaseOrderService = {
  getAllPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get("/purchase-orders");
    return response.data.data.data;
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.data;
  },

  createPurchaseOrder: async (dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const response = await api.post("/purchase-orders", dto);
    return response.data.data;
  },

  updatePurchaseOrder: async (id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const response = await api.patch(`/purchase-orders/${id}`, dto);
    return response.data.data;
  },

  deletePurchaseOrder: async (id: string): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },

  submitPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/submit`);
    return response.data.data;
  },

  approvePurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/approve`);
    return response.data.data;
  },

  rejectPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/reject`);
    return response.data.data;
  },

  cancelPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/cancel`);
    return response.data.data;
  },

  receivePurchaseOrder: async (
    id: string,
    items: ReceiveItemDto[]
  ): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/receive`, items);
    return response.data.data;
  },
};
