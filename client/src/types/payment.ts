export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceNo?: string;
  remarks?: string;
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
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE";

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