export interface Expense {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  vendor: string;
  vendorId?: string;
  receiptUrl?: string;
  notes?: string;
  status: ExpenseStatus;
  tenantId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  vendorRef?: {
    id: string;
    name: string;
    vendorCode: string;
  };
}

export type ExpenseCategory =
  | "SALARY"
  | "RENT"
  | "UTILITIES"
  | "SUPPLIES"
  | "MARKETING"
  | "TRAVEL"
  | "MAINTENANCE"
  | "OTHER";

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE";

export interface CreateExpenseDto {
  description: string;
  amount: string;
  expenseDate: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  vendor: string;
  vendorId?: string;
  receiptUrl?: string;
  notes?: string;
  status?: ExpenseStatus;
}

export interface UpdateExpenseDto {
  description?: string;
  amount?: string;
  expenseDate?: string;
  category?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  vendor?: string;
  vendorId?: string;
  receiptUrl?: string;
  notes?: string;
  status?: ExpenseStatus;
}
