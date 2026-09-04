import api from "./api";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE" | "OTHER";
  normalBalanceSide: "DEBIT" | "CREDIT";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string | null;
  createdAt: string;
  account: Account;
}

export interface JournalEntry {
  id: string;
  date: string;
  description?: string | null;
  referenceId?: string | null;
  posted: boolean;
  postedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  fiscalYearId?: string | null;
  lines: JournalEntryLine[];
}

export interface CreateJournalEntryDto {
  date?: string;
  description?: string;
  referenceId?: string;
  posted?: boolean;
  lines: {
    accountId: string;
    description?: string;
    debitAmount?: string;
    creditAmount?: string;
  }[];
}

export interface TrialBalanceEntry {
  accountId: string;
  code: string;
  name: string;
  type: string;
  normalBalanceSide: string;
  debitBalance: number;
  creditBalance: number;
  balance: number;
}

export interface GeneralLedgerEntry {
  date: string;
  description: string | null;
  referenceId: string | null;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
}

export const financeService = {
  getAccounts: async (page = 1, limit = 50) => {
    const response = await api.get("/finance/accounts", { params: { page, limit } });
    return response.data.data ?? response.data;
  },

  createAccount: async (dto: { code: string; name: string; type: string; normalBalanceSide: string }) => {
    const response = await api.post("/finance/accounts", dto);
    return response.data.data ?? response.data;
  },

  getJournalEntries: async (page = 1, limit = 20, params?: Record<string, string | boolean>) => {
    const response = await api.get("/finance/journal-entries", { params: { page, limit, ...params } });
    return response.data.data ?? response.data;
  },

  createJournalEntry: async (dto: CreateJournalEntryDto) => {
    const response = await api.post("/finance/journal-entries", dto);
    return response.data.data ?? response.data;
  },

  getTrialBalance: async (params?: { dateFrom?: string; dateTo?: string }) => {
    const response = await api.get("/finance/trial-balance", { params });
    return response.data;
  },

  getProfitAndLoss: async (params?: { dateFrom?: string; dateTo?: string }) => {
    const response = await api.get("/finance/profit-loss", { params });
    return response.data;
  },

  getGeneralLedger: async (params?: { dateFrom?: string; dateTo?: string; accountId?: string; referenceId?: string }) => {
    const response = await api.get("/finance/general-ledger", { params });
    return response.data;
  },

  getFiscalYears: async () => {
    const response = await api.get("/finance/fiscal-years");
    return response.data;
  },

  createFiscalYear: async (dto: { year: number; startDate: string; endDate: string }) => {
    const response = await api.post("/finance/fiscal-years", dto);
    return response.data.data ?? response.data;
  },

  seedAccounts: async () => {
    const response = await api.post("/finance/seed-accounts");
    return response.data;
  },
};
