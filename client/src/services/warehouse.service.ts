import api from "./api";
import type { Warehouse, CreateWarehouseDto, UpdateWarehouseDto, WarehouseQueryParams } from "../types/warehouse";

export const warehouseService = {
  getAllWarehouses: async (params?: WarehouseQueryParams) => {
    const response = await api.get("/warehouses", { params });
    return response.data;
  },

  getWarehouseById: async (id: string): Promise<Warehouse> => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data.data || response.data;
  },

  createWarehouse: async (dto: CreateWarehouseDto): Promise<Warehouse> => {
    const response = await api.post("/warehouses", dto);
    return response.data.data || response.data;
  },

  updateWarehouse: async (id: string, dto: UpdateWarehouseDto): Promise<Warehouse> => {
    const response = await api.patch(`/warehouses/${id}`, dto);
    return response.data.data || response.data;
  },

  deleteWarehouse: async (id: string): Promise<{ success: boolean; message: string; deactivated?: boolean }> => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data.data || response.data;
  },
};
