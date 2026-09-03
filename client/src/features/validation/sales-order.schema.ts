import { z } from "zod";

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => v.toString());

export const createSalesOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, "Quantity must be greater than 0"),
  unitPrice: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 0, "Unit price must be 0 or greater"),
  discount: z.union([z.string(), z.number()]).optional(),
  tax: z.union([z.string(), z.number()]).optional(),
  lineTotal: z.union([z.string(), z.number()]).optional(),
  sequence: z.number().optional(),
});

export const createSalesOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  clientId: z.string().min(1, "Client is required"),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDeliveryDate: z.string().optional(),
  items: z.array(createSalesOrderItemSchema).min(1, "At least one item is required"),
  subtotal: decimalString,
  discount: z.union([z.string(), z.number()]).optional(),
  tax: z.union([z.string(), z.number()]).optional(),
  total: decimalString,
  notes: z.string().optional(),
});

export const updateSalesOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required").optional(),
  clientId: z.string().min(1, "Client is required").optional(),
  orderDate: z.string().min(1, "Order date is required").optional(),
  expectedDeliveryDate: z.string().optional(),
  subtotal: z.union([z.string(), z.number()]).optional(),
  discount: z.union([z.string(), z.number()]).optional(),
  tax: z.union([z.string(), z.number()]).optional(),
  total: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
});

export type CreateSalesOrderFormData = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderFormData = z.infer<typeof updateSalesOrderSchema>;
