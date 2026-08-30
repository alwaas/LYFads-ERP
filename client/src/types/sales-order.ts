export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  lineTotal: number;
  fulfilledQuantity?: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit?: string;
  };
}

export interface SalesOrder {
  id: string;
  tenantId: string;
  clientId: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: SalesOrderStatus;
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
  client: {
    id: string;
    companyName: string;
    contactPerson: string;
  };
  items: SalesOrderItem[];
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

export type SalesOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED";

export interface CreateSalesOrderDto {
  clientId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: SalesOrderItemDto[];
}

export interface UpdateSalesOrderDto {
  clientId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  status?: SalesOrderStatus;
  items?: SalesOrderItemDto[];
}

export interface SalesOrderItemDto {
  productId: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
}

export interface FulfillItemDto {
  itemId: string;
  fulfillQuantity: number;
}
