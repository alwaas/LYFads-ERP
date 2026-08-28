import { z } from "zod";

export const createProductSchema = z.object({
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50, "SKU must not exceed 50 characters")
    .trim(),

  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must not exceed 100 characters")
    .trim(),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),

  unitPrice: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Unit price must be a valid non-negative number",
    })
    .transform((val) => parseFloat(val)),

  costPrice: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Cost price must be a valid non-negative number",
    })
    .transform((val) => parseFloat(val)),

  stockQuantity: z
    .string()
    .optional()
    .default("0")
    .transform((val) => parseInt(val, 10) || 0),

  minStockLevel: z
    .string()
    .optional()
    .default("0")
    .transform((val) => parseInt(val, 10) || 0),

  isActive: z.boolean().optional().default(true),
});

export const editProductSchema = createProductSchema.partial().extend({
  sku: z
    .string()
    .max(50, "SKU must not exceed 50 characters")
    .trim()
    .optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type EditProductFormData = z.infer<typeof editProductSchema>;
