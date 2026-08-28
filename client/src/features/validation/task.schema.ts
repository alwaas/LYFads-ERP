import { z } from "zod";

export const taskStatusEnum = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "CANCELLED",
] as const;

export type TaskStatus = (typeof taskStatusEnum)[number];

export const taskPriorityEnum = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export type TaskPriority = (typeof taskPriorityEnum)[number];

export const createTaskSchema = z.object({
  taskCode: z
    .string()
    .min(1, "Task code is required")
    .max(50, "Task code must not exceed 50 characters")
    .trim(),

  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Task title must not exceed 100 characters")
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

  employeeId: z
    .string()
    .uuid("Invalid employee ID")
    .optional()
    .default(""),

  status: z.enum(taskStatusEnum, {
    message: "Please select a valid status",
  }).default("TODO"),

  priority: z.enum(taskPriorityEnum, {
    message: "Please select a valid priority",
  }).default("MEDIUM"),

  dueDate: z
    .string()
    .optional()
    .default(""),

  estimatedHours: z.coerce
    .number()
    .finite("Estimated hours must be a valid number")
    .nonnegative("Estimated hours cannot be negative")
    .optional(),
});

export const editTaskSchema = createTaskSchema.partial().extend({
  taskCode: z
    .string()
    .min(1, "Task code is required")
    .max(50, "Task code must not exceed 50 characters")
    .trim()
    .optional(),
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Task title must not exceed 100 characters")
    .trim()
    .optional(),
  projectId: z
    .string()
    .min(1, "Project is required")
    .uuid("Invalid project ID")
    .optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type EditTaskFormData = z.infer<typeof editTaskSchema>;
