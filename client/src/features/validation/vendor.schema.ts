import { z } from "zod";

export const createVendorSchema = z.object({
  name: z
    .string()
    .min(1, "Vendor name is required")
    .max(100, "Vendor name must not exceed 100 characters"),

  contactPerson: z
    .string()
    .max(100, "Contact person name must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),

  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),

  address: z
    .string()
    .max(500, "Address must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),

  city: z
    .string()
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  state: z
    .string()
    .max(100, "State must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  country: z
    .string()
    .max(100, "Country must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  pincode: z
    .string()
    .max(20, "Pincode must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),

  gstNumber: z
    .string()
    .max(50, "GST number must not exceed 50 characters")
    .trim()
    .optional()
    .default(""),

  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
});

export const editVendorSchema = createVendorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateVendorFormData = z.infer<typeof createVendorSchema>;
export type EditVendorFormData = z.infer<typeof editVendorSchema>;
