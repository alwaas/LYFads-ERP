export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  discount: number;
  tax: number;
  lineTotal: number;
  sequence: number;
  createdAt: string;
  tenantId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  warehouseId?: string | null;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  status: PurchaseOrderStatus;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  vendor: {
    id: string;
    name: string;
    email?: string;
    contactPerson?: string;
    phone?: string;
  };
  warehouse?: {
    id: string;
    name: string;
  } | null;
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemDto {
  productId: string;
  quantity: string | number;
  unitCost: string | number;
  discount?: string | number;
  tax?: string | number;
  lineTotal?: string | number;
  sequence?: number;
}

export interface CreatePurchaseOrderDto {
  orderNumber: string;
  vendorId: string;
  warehouseId?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: CreatePurchaseOrderItemDto[];
  subtotal: string | number;
  discount?: string | number;
  tax?: string | number;
  total: string | number;
  notes?: string;
}

export interface UpdatePurchaseOrderDto {
  orderNumber?: string;
  vendorId?: string;
  warehouseId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  subtotal?: string | number;
  discount?: string | number;
  tax?: string | number;
  total?: string | number;
  notes?: string;
}

export interface ReceiveItemDto {
  itemId: string;
  quantity: string | number;
}

export interface ReceivePurchaseOrderDto {
  warehouseId: string;
  items: ReceiveItemDto[];
  notes?: string;
}
