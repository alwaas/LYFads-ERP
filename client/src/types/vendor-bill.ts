export type VendorBillStatus =
  | "DRAFT"
  | "APPROVED"
  | "POSTED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOIDED"
  | "CANCELLED";

export interface VendorBillItem {
  id: string;
  purchaseInvoiceId: string;
  description: string;
  quantity: number;
  unitCost: number;
  tax: number;
  discount: number;
  lineTotal: number;
  sequence: number;
  tenantId: string;
  createdAt: string;
}

export interface VendorBill {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
    email?: string;
    contactPerson?: string;
    phone?: string;
  };
  purchaseOrderId?: string | null;
  purchaseOrder?: {
    id: string;
    orderNumber: string;
  } | null;
  issueDate: string;
  dueDate: string;
  status: VendorBillStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  items: VendorBillItem[];
}

export interface CreateVendorBillItemDto {
  description: string;
  quantity: string | number;
  unitCost: string | number;
  tax?: string | number;
  discount?: string | number;
  lineTotal?: string | number;
  sequence?: number;
}

export interface CreateVendorBillDto {
  invoiceNumber: string;
  vendorId: string;
  purchaseOrderId?: string;
  issueDate?: string;
  dueDate: string;
  notes?: string;
  items: CreateVendorBillItemDto[];
}

export interface UpdateVendorBillDto {
  invoiceNumber?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  dueDate?: string;
  items?: CreateVendorBillItemDto[];
  notes?: string;
}

export interface VendorBillQueryParams {
  search?: string;
  status?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  dateFrom?: string;
  dateTo?: string;
}
