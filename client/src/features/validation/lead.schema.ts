import { z } from "zod";

export const leadStatusEnum = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type LeadStatus = (typeof leadStatusEnum)[number];

export const leadSourceEnum = [
  "WEBSITE",
  "FACEBOOK",
  "INSTAGRAM",
  "GOOGLE",
  "REFERRAL",
  "WHATSAPP",
  "OTHER",
] as const;

export type LeadSource = (typeof leadSourceEnum)[number];

export const createLeadSchema = z.object({
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
    .email("Invalid email format")
    .max(100, "Email must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  phone: z
    .string()
    .max(20, "Phone must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),

  status: z.enum(leadStatusEnum, {
    message: "Please select a valid status",
  }).optional()
    .default("NEW"),

  source: z.enum(leadSourceEnum, {
    message: "Please select a valid source",
  }).optional()
    .default("OTHER"),

  estimatedValue: z.coerce
    .number()
    .finite("Estimated value must be a valid number")
    .nonnegative("Estimated value cannot be negative")
    .optional()
    .default(0),

  remarks: z
    .string()
    .max(1000, "Remarks must not exceed 1000 characters")
    .trim()
    .optional()
    .default(""),
});

export const editLeadSchema = createLeadSchema.partial().extend({
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
    .email("Invalid email format")
    .max(100, "Email must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;
export type EditLeadFormData = z.infer<typeof editLeadSchema>;
