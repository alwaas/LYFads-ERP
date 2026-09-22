import { z } from "zod";

export const milestoneStatusEnum = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
] as const;

export type MilestoneStatus = (typeof milestoneStatusEnum)[number];

export const milestonePriorityEnum = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type MilestonePriority = (typeof milestonePriorityEnum)[number];

export const createMilestoneSchema = z.object({
  title: z
    .string()
    .min(1, "Milestone title is required")
    .max(100, "Milestone title must not exceed 100 characters")
    .trim(),

  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .default(""),

  projectId: z
    .string()
    .min(1, "Project is required")
    .uuid("Invalid project ID"),

  status: z.enum(milestoneStatusEnum, {
    message: "Please select a valid status",
  }).default("NOT_STARTED"),

  priority: z.enum(milestonePriorityEnum, {
    message: "Please select a valid priority",
  }).default("MEDIUM"),

  progress: z.coerce
    .number()
    .int("Progress must be a whole number")
    .min(0, "Progress cannot be less than 0")
    .max(100, "Progress cannot be more than 100")
    .default(0),

  startDate: z
    .string()
    .min(1, "Start date is required"),

  deadline: z
    .string()
    .min(1, "Deadline is required"),
}).refine((data) => {
  if (data.startDate && data.deadline) {
    return new Date(data.deadline) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "Deadline cannot be before start date",
  path: ["deadline"],
});

export const editMilestoneSchema = createMilestoneSchema.partial().extend({
  title: z
    .string()
    .min(1, "Milestone title is required")
    .max(100, "Milestone title must not exceed 100 characters")
    .trim()
    .optional(),
  projectId: z
    .string()
    .min(1, "Project is required")
    .uuid("Invalid project ID")
    .optional(),
  startDate: z
    .string()
    .optional(),
  deadline: z
    .string()
    .optional(),
});

export type CreateMilestoneFormData = z.infer<typeof createMilestoneSchema>;
export type EditMilestoneFormData = z.infer<typeof editMilestoneSchema>;
