import { z } from "zod";

export const updateSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(255, "Company name must not exceed 255 characters")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone must not exceed 20 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(1000, "Address must not exceed 1000 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  logo: z
    .string()
    .url("Invalid logo URL")
    .max(500, "Logo URL must not exceed 500 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  timezone: z
    .string()
    .min(3, "Timezone is required")
    .max(50, "Timezone must not exceed 50 characters")
    .trim()
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code (e.g., USD, INR)")
    .trim()
    .optional(),
});

export type UpdateSettingsFormData = z.infer<typeof updateSettingsSchema>;
