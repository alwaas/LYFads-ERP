import { z } from "zod";

export const projectStatusEnum = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ProjectStatus = (typeof projectStatusEnum)[number];

export const projectPriorityEnum = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export type ProjectPriority = (typeof projectPriorityEnum)[number];

export const createProjectSchema = z.object({
  projectCode: z
    .string()
    .min(1, "Project code is required")
    .max(50, "Project code must not exceed 50 characters")
    .trim(),

  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must not exceed 100 characters")
    .trim(),

  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .default(""),

  clientId: z
    .string()
    .min(1, "Client is required")
    .uuid("Invalid client ID"),

  managerId: z
    .string()
    .uuid("Invalid manager ID")
    .optional()
    .default(""),

  status: z.enum(projectStatusEnum, {
    message: "Please select a valid status",
  }).default("PLANNING"),

  priority: z.enum(projectPriorityEnum, {
    message: "Please select a valid priority",
  }).default("MEDIUM"),

  budget: z.coerce
    .number()
    .finite("Budget must be a valid number")
    .nonnegative("Budget cannot be negative")
    .optional(),

  startDate: z
    .string()
    .optional()
    .default(""),

  endDate: z
    .string()
    .optional()
    .default(""),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

export const editProjectSchema = createProjectSchema.partial().extend({
  projectCode: z
    .string()
    .min(1, "Project code is required")
    .max(50, "Project code must not exceed 50 characters")
    .trim()
    .optional(),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must not exceed 100 characters")
    .trim()
    .optional(),
  clientId: z
    .string()
    .min(1, "Client is required")
    .uuid("Invalid client ID")
    .optional(),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type EditProjectFormData = z.infer<typeof editProjectSchema>;
