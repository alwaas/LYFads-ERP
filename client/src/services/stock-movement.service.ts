import api from "./api";
import type { StockMovement, CreateStockMovementDto, StockMovementQueryParams } from "../types/stock-movement";

export const stockMovementService = {
  getAllStockMovements: async (params?: StockMovementQueryParams) => {
    const response = await api.get("/stock-movements", { params });
    return response.data;
  },

  getStockMovementById: async (id: string): Promise<StockMovement> => {
    const response = await api.get(`/stock-movements/${id}`);
    return response.data.data || response.data;
  },

  createStockMovement: async (dto: CreateStockMovementDto): Promise<StockMovement> => {
    const response = await api.post("/stock-movements", dto);
    return response.data.data || response.data;
  },
};
