import { z } from "zod";

export const invoiceStatusEnum = [
  "DRAFT",
  "SENT",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;

export type InvoiceStatus = (typeof invoiceStatusEnum)[number];

export const createInvoiceSchema = z.object({
  invoiceNumber: z
    .string()
    .min(1, "Invoice number is required")
    .max(50, "Invoice number must not exceed 50 characters")
    .trim(),

  clientId: z
    .string()
    .min(1, "Client is required")
    .uuid("Invalid client ID"),

  projectId: z
    .string()
    .uuid("Invalid project ID")
    .optional()
    .default(""),

  issueDate: z
    .string()
    .min(1, "Issue date is required"),

  dueDate: z
    .string()
    .min(1, "Due date is required"),

  status: z.enum(invoiceStatusEnum, {
    message: "Please select a valid status",
  }).default("DRAFT"),

  notes: z
    .string()
    .max(1000, "Notes must not exceed 1000 characters")
    .trim()
    .optional()
    .default(""),
}).refine((data) => {
  if (data.issueDate && data.dueDate) {
    return new Date(data.dueDate) >= new Date(data.issueDate);
  }
  return true;
}, {
  message: "Due date cannot be earlier than issue date",
  path: ["dueDate"],
});

export const editInvoiceSchema = createInvoiceSchema.partial().extend({
  invoiceNumber: z
    .string()
    .min(1, "Invoice number is required")
    .max(50, "Invoice number must not exceed 50 characters")
    .trim()
    .optional(),
  clientId: z
    .string()
    .min(1, "Client is required")
    .uuid("Invalid client ID")
    .optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>;

export const invoiceItemSchema = z.object({
  description: z
    .string()
    .max(500, "Item description must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),

  quantity: z.coerce
    .number()
    .finite("Quantity must be a valid number")
    .nonnegative("Quantity must be a positive number"),

  unitPrice: z.coerce
    .number()
    .finite("Unit price must be a valid number")
    .nonnegative("Unit price must be a positive number"),

  amount: z.coerce
    .number()
    .finite("Amount must be a valid number")
    .nonnegative("Amount must be a positive number"),
});

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;
