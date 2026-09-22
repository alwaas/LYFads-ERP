export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  location?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    stockMovements: number;
    warehouseStocks: number;
  };
}

export interface CreateWarehouseDto {
  name: string;
  location?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  location?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface WarehouseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
