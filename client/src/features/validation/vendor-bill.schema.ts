import { z } from "zod";

export const createVendorBillItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) > 0, "Quantity must be greater than 0"),
  unitCost: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) >= 0, "Unit cost must be 0 or greater"),
  discount: z.union([z.string(), z.number()]).optional(),
  tax: z.union([z.string(), z.number()]).optional(),
  lineTotal: z.union([z.string(), z.number()]).optional(),
  sequence: z.number().optional(),
});

export const createVendorBillSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  purchaseOrderId: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(createVendorBillItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

export const updateVendorBillSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required").optional(),
  vendorId: z.string().min(1, "Vendor is required").optional(),
  purchaseOrderId: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  items: z.array(createVendorBillItemSchema).min(1, "At least one item is required").optional(),
  notes: z.string().optional(),
});

export type CreateVendorBillFormData = z.infer<typeof createVendorBillSchema>;
export type UpdateVendorBillFormData = z.infer<typeof updateVendorBillSchema>;
export type CreateVendorBillItemFormData = z.infer<typeof createVendorBillItemSchema>;
