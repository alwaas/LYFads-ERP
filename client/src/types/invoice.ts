export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
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
  client?: {
    id: string;
    companyName: string;
  };
  project?: {
    id: string;
    name: string;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
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

export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

export interface CreateInvoiceDto {
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax?: string;
  discount?: string;
  total: string;
  paidAmount?: string;
  balanceAmount: string;
  status?: InvoiceStatus;
  notes?: string;
}

export interface UpdateInvoiceDto {
  invoiceNumber?: string;
  clientId?: string;
  projectId?: string;
  issueDate?: string;
  dueDate?: string;
  subtotal?: string;
  tax?: string;
  discount?: string;
  total?: string;
  paidAmount?: string;
  balanceAmount?: string;
  status?: InvoiceStatus;
  notes?: string;
}
