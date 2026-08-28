export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  warehouseStocks?: ProductWarehouseStock[];
  _count?: {
    stockMovements: number;
  };
}

export interface ProductWarehouseStock {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  warehouse: {
    id: string;
    name: string;
    location?: string;
    isActive: boolean;
  };
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity?: number;
  minStockLevel?: number;
  isActive?: boolean;
}

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  unitPrice?: number;
  costPrice?: number;
  minStockLevel?: number;
  isActive?: boolean;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
