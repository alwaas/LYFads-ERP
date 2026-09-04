import { z } from "zod";

export const AccountType = z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE", "OTHER"]);
export const NormalBalanceSide = z.enum(["DEBIT", "CREDIT"]);

export const createAccountSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  type: AccountType,
  normalBalanceSide: NormalBalanceSide,
});

export const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  description: z.string().optional(),
  debitAmount: z.union([z.string(), z.number()]).optional(),
  creditAmount: z.union([z.string(), z.number()]).optional(),
});

export const createJournalEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  referenceId: z.string().optional(),
  posted: z.boolean().optional(),
  lines: z.array(journalEntryLineSchema).min(2, "At least two lines are required"),
});

export type AccountTypeValue = z.infer<typeof AccountType>;
export type NormalBalanceSideValue = z.infer<typeof NormalBalanceSide>;
export type CreateAccountFormData = z.infer<typeof createAccountSchema>;
export type CreateJournalEntryFormData = z.infer<typeof createJournalEntrySchema>;
export type JournalEntryLineFormData = z.infer<typeof journalEntryLineSchema>;
