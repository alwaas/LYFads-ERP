import { z } from "zod";

export const createClientSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must not exceed 100 characters")
    .trim(),

  contactPerson: z
    .string()
    .min(1, "Contact person is required")
    .max(100, "Contact person must not exceed 100 characters")
    .trim(),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(100, "Email must not exceed 100 characters")
    .trim(),

  phone: z
    .string()
    .max(20, "Phone must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),

  gstNumber: z
    .string()
    .max(20, "GST number must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),

  website: z
    .string()
    .max(200, "Website must not exceed 200 characters")
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
    .max(10, "Pincode must not exceed 10 characters")
    .trim()
    .optional()
    .default(""),
});

export const editClientSchema = createClientSchema.partial().extend({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must not exceed 100 characters")
    .trim()
    .optional(),
  contactPerson: z
    .string()
    .min(1, "Contact person is required")
    .max(100, "Contact person must not exceed 100 characters")
    .trim()
    .optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(100, "Email must not exceed 100 characters")
    .trim()
    .optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type EditClientFormData = z.infer<typeof editClientSchema>;
