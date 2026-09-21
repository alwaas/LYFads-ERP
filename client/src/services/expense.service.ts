import api from "./api";

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

export interface ExpenseQueryParams {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  method?: PaymentMethod;
  search?: string;
}

export const expenseService = {
  getAllExpenses: async (params?: ExpenseQueryParams) => {
    const response = await api.get("/expenses", { params });
    return response.data.data;
  },

  getExpenseById: async (id: string): Promise<Expense> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data.data || response.data;
  },

  createExpense: async (dto: CreateExpenseDto): Promise<Expense> => {
    const response = await api.post("/expenses", dto);
    return response.data.data || response.data;
  },

  updateExpense: async (id: string, dto: UpdateExpenseDto): Promise<Expense> => {
    const response = await api.patch(`/expenses/${id}`, dto);
    return response.data.data || response.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};
