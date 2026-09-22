import api from "./api";
import type { SalesOrder, CreateSalesOrderDto, UpdateSalesOrderDto, CreateSalesOrderItemDto } from "../types/sales-order";

export const salesOrderService = {
  getAllSalesOrders: async (page = 1, limit = 10, search?: string, status?: string, clientId?: string) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;
    if (clientId) params.clientId = clientId;
    const response = await api.get("/sales-orders", { params });
    return response.data.data ?? response.data;
  },

  getSalesOrderById: async (id: string): Promise<SalesOrder> => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data.data ?? response.data;
  },

  createSalesOrder: async (dto: CreateSalesOrderDto): Promise<SalesOrder> => {
    const response = await api.post("/sales-orders", dto);
    return response.data.data ?? response.data;
  },

  updateSalesOrder: async (id: string, dto: UpdateSalesOrderDto): Promise<SalesOrder> => {
    const response = await api.patch(`/sales-orders/${id}`, dto);
    return response.data.data ?? response.data;
  },

  deleteSalesOrder: async (id: string): Promise<void> => {
    await api.delete(`/sales-orders/${id}`);
  },

  addItems: async (id: string, items: CreateSalesOrderItemDto[]): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/items`, { items });
    return response.data.data ?? response.data;
  },

  removeItem: async (id: string, itemId: string): Promise<SalesOrder> => {
    const response = await api.delete(`/sales-orders/${id}/items/${itemId}`);
    return response.data.data ?? response.data;
  },

  confirmSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/confirm`);
    return response.data.data ?? response.data;
  },

  processSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/process`);
    return response.data.data ?? response.data;
  },

  fulfillSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/fulfill`);
    return response.data.data ?? response.data;
  },

  fulfillWithInventory: async (id: string): Promise<{ alreadyFulfilled: boolean; movements: number }> => {
    const response = await api.post(`/sales-orders/${id}/fulfill-with-inventory`);
    return response.data.data ?? response.data;
  },

  cancelSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/cancel`);
    return response.data.data ?? response.data;
  },
};
