import { z } from "zod";

export const createSalesOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  clientId: z.string().min(1, "Client is required"),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDeliveryDate: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "PROCESSING", "FULFILLED", "CANCELLED"]).optional(),
  subtotal: z.string().min(1, "Subtotal is required"),
  discount: z.string().optional(),
  tax: z.string().optional(),
  total: z.string().min(1, "Total is required"),
  notes: z.string().optional(),
});

export const updateSalesOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required").optional(),
  clientId: z.string().min(1, "Client is required").optional(),
  orderDate: z.string().min(1, "Order date is required").optional(),
  expectedDeliveryDate: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "PROCESSING", "FULFILLED", "CANCELLED"]).optional(),
  subtotal: z.string().min(1, "Subtotal is required").optional(),
  discount: z.string().optional(),
  tax: z.string().optional(),
  total: z.string().min(1, "Total is required").optional(),
  notes: z.string().optional(),
});

export type CreateSalesOrderFormData = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderFormData = z.infer<typeof updateSalesOrderSchema>;
