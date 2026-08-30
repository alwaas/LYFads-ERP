export interface Inventory {
  id: string;
  tenantId: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    sku: string;
    name: string;
    unit?: string;
    reorderLevel?: number;
    status: string;
  };
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  createdById?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export type StockMovementType =
  | "PURCHASE_RECEIPT"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

export interface StockStatus {
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  quantity: number;
  reorderLevel: number | null;
}
