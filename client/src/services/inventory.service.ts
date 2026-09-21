import api from "./api";
import type { Inventory, StockMovement, StockStatus } from "../types/inventory";

export const inventoryService = {
  getInventory: async (): Promise<Inventory[]> => {
    const response = await api.get("/inventory");
    return response.data.data.data;
  },

  getInventoryByProduct: async (productId: string): Promise<Inventory | null> => {
    const response = await api.get(`/inventory/${productId}`);
    return response.data.data || null;
  },

  getStockMovements: async (productId: string): Promise<StockMovement[]> => {
    const response = await api.get(`/inventory/${productId}/movements`);
    return response.data.data;
  },

  getStockStatus: async (productId: string): Promise<StockStatus> => {
    const response = await api.get(`/inventory/${productId}/status`);
    return response.data.data;
  },

  adjustStock: async (
    productId: string,
    type: string,
    quantity: number,
    note: string
  ): Promise<void> => {
    await api.post(`/inventory/${productId}/adjust`, {
      type,
      quantity,
      note,
    });
  },
};
