export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'FULFILLED' | 'CANCELLED';

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
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

export interface SalesOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: SalesOrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  client: {
    id: string;
    companyName: string;
    email?: string;
    contactPerson?: string;
  };
  items: SalesOrderItem[];
}

export interface CreateSalesOrderDto {
  orderNumber: string;
  clientId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status?: SalesOrderStatus;
  subtotal: number | string;
  discount?: number | string;
  tax?: number | string;
  total: number | string;
  notes?: string;
  tenantId?: string;
}

export interface UpdateSalesOrderDto {
  orderNumber?: string;
  clientId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  status?: SalesOrderStatus;
  subtotal?: number | string;
  discount?: number | string;
  tax?: number | string;
  total?: number | string;
  notes?: string;
}
