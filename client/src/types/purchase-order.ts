export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  lineTotal: number;
  receivedQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  vendorId: string;
  poNumber: string;
  title: string;
  description?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdById?: string;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    name: string;
    vendorCode: string;
  };
  items: PurchaseOrderItem[];
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface CreatePurchaseOrderDto {
  vendorId: string;
  title: string;
  description?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: PurchaseOrderItemDto[];
}

export interface UpdatePurchaseOrderDto {
  vendorId?: string;
  title?: string;
  description?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  status?: PurchaseOrderStatus;
  items?: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemDto {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
}

export interface ReceiveItemDto {
  itemId: string;
  receivedQuantity: number;
}
