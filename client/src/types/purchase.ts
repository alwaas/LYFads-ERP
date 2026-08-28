export interface Purchase {
  id: string;
  purchaseDate: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  referenceNo?: string;
  description: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE";

export interface CreatePurchaseDto {
  purchaseDate: string;
  vendorId: string;
  referenceNo?: string;
  description: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface UpdatePurchaseDto {
  purchaseDate?: string;
  vendorId?: string;
  referenceNo?: string;
  description?: string;
  subtotal?: string;
  tax?: string;
  total?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface PurchaseQueryParams {
  dateFrom?: string;
  dateTo?: string;
  vendorId?: string;
  method?: PaymentMethod;
  search?: string;
}
