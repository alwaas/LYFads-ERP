export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  sourceWarehouse?: {
    id: string;
    name: string;
  };
  destinationWarehouse?: {
    id: string;
    name: string;
  };
}

export const StockMovementType = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
  TRANSFER: 'TRANSFER',
} as const;

export type StockMovementType = typeof StockMovementType[keyof typeof StockMovementType];

export interface CreateStockMovementDto {
  productId: string;
  warehouseId?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface StockMovementQueryParams {
  productId?: string;
  warehouseId?: string;
  type?: StockMovementType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
