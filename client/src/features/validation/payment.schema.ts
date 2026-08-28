import { z } from "zod";

export const paymentMethodEnum = [
  "CASH",
  "BANK_TRANSFER",
  "UPI",
  "CARD",
  "CHEQUE",
] as const;

export type PaymentMethod = (typeof paymentMethodEnum)[number];

export const createPaymentSchema = z.object({
  invoiceId: z
    .string()
    .min(1, "Invoice is required")
    .uuid("Invalid invoice ID"),

  amount: z.coerce
    .number()
    .finite("Amount must be a valid number")
    .positive("Amount must be greater than zero"),

  paymentDate: z
    .string()
    .min(1, "Payment date is required"),

  method: z.enum(paymentMethodEnum, {
    message: "Please select a valid payment method",
  }),

  referenceNo: z
    .string()
    .max(100, "Reference number must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  remarks: z
    .string()
    .max(500, "Remarks must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
});

export const editPaymentSchema = createPaymentSchema.partial().extend({
  invoiceId: z
    .string()
    .uuid("Invalid invoice ID")
    .optional(),
  amount: z.coerce
    .number()
    .finite("Amount must be a valid number")
    .positive("Amount must be greater than zero")
    .optional(),
  paymentDate: z
    .string()
    .optional(),
  method: z.enum(paymentMethodEnum, {
    message: "Please select a valid payment method",
  }).optional(),
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;
export type EditPaymentFormData = z.infer<typeof editPaymentSchema>;
