export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceNo?: string;
  remarks?: string;
  status: PaymentStatus;
  voidedAt?: string;
  voidedById?: string;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    client?: {
      id: string;
      companyName: string;
    };
  };
  allocations?: PaymentAllocation[];
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE";

export type PaymentStatus = "ACTIVE" | "VOIDED";

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  payment?: {
    id: string;
    amount: number;
    paymentDate: string;
    method: PaymentMethod;
    referenceNo?: string;
    status: PaymentStatus;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
    balanceAmount: number;
    client?: {
      id: string;
      companyName: string;
    };
  };
}

export interface CreatePaymentDto {
  invoiceId: string;
  amount: string;
  paymentDate: string;
  method: PaymentMethod;
  referenceNo?: string;
  remarks?: string;
}

export interface UpdatePaymentDto {
  amount?: string;
  paymentDate?: string;
  method?: PaymentMethod;
  referenceNo?: string;
  remarks?: string;
}

export interface PaymentResponse {
  data: Payment[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CreatePaymentAllocationDto {
  paymentId: string;
  invoiceId: string;
  amount: string;
}