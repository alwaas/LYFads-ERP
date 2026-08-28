import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z
    .string()
    .min(1, "Warehouse name is required")
    .max(100, "Warehouse name must not exceed 100 characters")
    .trim(),

  location: z
    .string()
    .max(200, "Location must not exceed 200 characters")
    .trim()
    .optional()
    .default(""),

  isDefault: z.boolean().optional().default(false),

  isActive: z.boolean().optional().default(true),
});

export const editWarehouseSchema = createWarehouseSchema.partial();

export type CreateWarehouseFormData = z.infer<typeof createWarehouseSchema>;
export type EditWarehouseFormData = z.infer<typeof editWarehouseSchema>;
