export interface Expense {
  id: string;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  notes?: string;
  status: string;
  vendor?: string;
  receiptUrl?: string;
  user?: {
    id: string;
    fullName: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE";

export interface CreateExpenseDto {
  expenseDate: string;
  category: string;
  description: string;
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  notes?: string;
}

export interface UpdateExpenseDto {
  expenseDate?: string;
  category?: string;
  description?: string;
  amount?: string;
  paymentMethod?: PaymentMethod;
  referenceNo?: string;
  notes?: string;
}
