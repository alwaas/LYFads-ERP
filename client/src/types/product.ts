export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  taxRate?: number;
  reorderLevel?: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  purchasePrice?: string;
  sellingPrice?: string;
  taxRate?: string;
  reorderLevel?: string;
  status?: ProductStatus;
  tenantId: string;
}

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  purchasePrice?: string;
  sellingPrice?: string;
  taxRate?: string;
  reorderLevel?: string;
  status?: ProductStatus;
}
