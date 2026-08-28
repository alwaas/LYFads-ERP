import { z } from "zod";

export const paymentMethodEnum = [
  "CASH",
  "BANK_TRANSFER",
  "UPI",
  "CARD",
  "CHEQUE",
] as const;

export type PaymentMethod = (typeof paymentMethodEnum)[number];

export const createExpenseSchema = z.object({
  expenseDate: z
    .string()
    .min(1, "Expense date is required"),

  category: z
    .string()
    .min(1, "Category is required")
    .max(100, "Category must not exceed 100 characters"),

  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must not exceed 500 characters"),

  amount: z.coerce
    .number()
    .finite("Amount must be a valid number")
    .positive("Amount must be greater than zero"),

  paymentMethod: z.enum(paymentMethodEnum, {
    message: "Please select a valid payment method",
  }),

  referenceNo: z
    .string()
    .max(100, "Reference number must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
});

export const editExpenseSchema = createExpenseSchema.partial().extend({
  expenseDate: z
    .string()
    .min(1, "Expense date is required")
    .optional(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(100, "Category must not exceed 100 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  amount: z.coerce
    .number()
    .finite("Amount must be a valid number")
    .positive("Amount must be greater than zero")
    .optional(),
  paymentMethod: z.enum(paymentMethodEnum, {
    message: "Please select a valid payment method",
  }).optional(),
});

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
export type EditExpenseFormData = z.infer<typeof editExpenseSchema>;
