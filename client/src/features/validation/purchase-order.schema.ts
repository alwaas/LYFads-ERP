import { z } from "zod";

export const createPurchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
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

export const createPurchaseOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  warehouseId: z.string().optional(),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDeliveryDate: z.string().optional(),
  items: z.array(createPurchaseOrderItemSchema).min(1, "At least one item is required"),
  subtotal: z.union([z.string(), z.number()]),
  discount: z.union([z.string(), z.number()]).optional(),
  tax: z.union([z.string(), z.number()]).optional(),
  total: z.union([z.string(), z.number()]),
  notes: z.string().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required").optional(),
  vendorId: z.string().min(1, "Vendor is required").optional(),
  warehouseId: z.string().optional(),
  orderDate: z.string().min(1, "Order date is required").optional(),
  expectedDeliveryDate: z.string().optional(),
  subtotal: z.union([z.string(), z.number()]).optional(),
  discount: z.union([z.string(), z.number()]).optional(),
  tax: z.union([z.string(), z.number()]).optional(),
  total: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;
