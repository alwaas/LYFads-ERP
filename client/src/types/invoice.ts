export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  salesOrderId?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  issuedAt?: string;
  client?: {
    id: string;
    companyName: string;
  };
  project?: {
    id: string;
    name: string;
  };
  salesOrder?: {
    id: string;
    orderNumber: string;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
  createdBy?: {
    id: string;
    fullName: string;
  };
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  salesOrderItemId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  lineTotal: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNo?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";

export interface CreateInvoiceDto {
  clientId: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  status?: InvoiceStatus;
  notes?: string;
  items: {
    description: string;
    quantity: string;
    unitPrice: string;
    taxRate?: string;
    taxAmount?: string;
    discount?: string;
  }[];
}

export interface UpdateInvoiceDto {
  clientId?: string;
  projectId?: string;
  issueDate?: string;
  dueDate?: string;
  status?: InvoiceStatus;
  notes?: string;
}

export interface CreateInvoiceFromSalesOrderDto {
  issueDate?: string;
  dueDate?: string;
  projectId?: string;
  notes?: string;
}

export interface AllocatePaymentDto {
  paymentId: string;
  amount: string;
}

export interface ARSummary {
  totalOutstanding: number;
  totalOverdue: number;
  currentReceivables: number;
  partiallyPaid: number;
  paidThisPeriod: number;
  invoiceCount: number;
  overdueInvoiceCount: number;
  aging: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
}
