import { z } from "zod";

export const createStockMovementSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().optional(),
  sourceWarehouseId: z.string().optional(),
  destinationWarehouseId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUST", "TRANSFER"]),
  quantity: z
    .string()
    .refine((val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0, {
      message: "Quantity must be a positive integer",
    })
    .transform((val) => parseInt(val, 10)),
  referenceType: z.string().max(50).trim().optional().default(""),
  referenceId: z.string().max(100).trim().optional().default(""),
  notes: z.string().max(500).trim().optional().default(""),
});

export type CreateStockMovementFormData = z.infer<typeof createStockMovementSchema>;
