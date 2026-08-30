import api from "./api";
import type {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
} from "../types/expense";

export const expenseService = {
  getAllExpenses: async (): Promise<Expense[]> => {
    const response = await api.get("/expenses");
    return response.data.data || response.data;
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
