import api from "./api";
import type {
  SalesOrder,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  FulfillItemDto,
} from "../types/sales-order";

export const salesOrderService = {
  getAllSalesOrders: async (): Promise<SalesOrder[]> => {
    const response = await api.get("/sales-orders");
    return response.data.data.data;
  },

  getSalesOrderById: async (id: string): Promise<SalesOrder> => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data.data;
  },

  createSalesOrder: async (dto: CreateSalesOrderDto): Promise<SalesOrder> => {
    const response = await api.post("/sales-orders", dto);
    return response.data.data;
  },

  updateSalesOrder: async (id: string, dto: UpdateSalesOrderDto): Promise<SalesOrder> => {
    const response = await api.patch(`/sales-orders/${id}`, dto);
    return response.data.data;
  },

  deleteSalesOrder: async (id: string): Promise<void> => {
    await api.delete(`/sales-orders/${id}`);
  },

  submitSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/submit`);
    return response.data.data;
  },

  approveSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/approve`);
    return response.data.data;
  },

  rejectSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/reject`);
    return response.data.data;
  },

  cancelSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/cancel`);
    return response.data.data;
  },

  fulfillSalesOrder: async (
    id: string,
    items: FulfillItemDto[]
  ): Promise<SalesOrder> => {
    const response = await api.post(`/sales-orders/${id}/fulfill`, items);
    return response.data.data;
  },
};
