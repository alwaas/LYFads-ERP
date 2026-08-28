import { z } from "zod";

export const paymentMethodEnum = [
  "CASH",
  "BANK_TRANSFER",
  "UPI",
  "CARD",
  "CHEQUE",
] as const;

export type PaymentMethod = (typeof paymentMethodEnum)[number];

export const createPurchaseSchema = z.object({
  purchaseDate: z
    .string()
    .min(1, "Purchase date is required"),

  vendorId: z
    .string()
    .min(1, "Vendor is required"),

  referenceNo: z
    .string()
    .max(100, "Reference number must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must not exceed 500 characters"),

  subtotal: z.coerce
    .number()
    .finite("Subtotal must be a valid number")
    .positive("Subtotal must be greater than zero"),

  tax: z.coerce
    .number()
    .finite("Tax must be a valid number")
    .nonnegative("Tax must be greater than or equal to zero"),

  total: z.coerce
    .number()
    .finite("Total must be a valid number")
    .positive("Total must be greater than zero"),

  paymentMethod: z.enum(paymentMethodEnum, {
    message: "Please select a valid payment method",
  }),

  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
});

export const editPurchaseSchema = createPurchaseSchema.partial().extend({
  purchaseDate: z
    .string()
    .min(1, "Purchase date is required")
    .optional(),
  vendorId: z
    .string()
    .min(1, "Vendor is required")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  subtotal: z.coerce
    .number()
    .finite("Subtotal must be a valid number")
    .positive("Subtotal must be greater than zero")
    .optional(),
  tax: z.coerce
    .number()
    .finite("Tax must be a valid number")
    .nonnegative("Tax must be greater than or equal to zero")
    .optional(),
  total: z.coerce
    .number()
    .finite("Total must be a valid number")
    .positive("Total must be greater than zero")
    .optional(),
  paymentMethod: z.enum(paymentMethodEnum, {
    message: "Please select a valid payment method",
  }).optional(),
});

export type CreatePurchaseFormData = z.infer<typeof createPurchaseSchema>;
export type EditPurchaseFormData = z.infer<typeof editPurchaseSchema>;
