import { z } from "zod";

export const workStatusEnum = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
] as const;

export type WorkStatus = (typeof workStatusEnum)[number];

export const createDailyWorkReportSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee is required"),
  projectId: z
    .string()
    .optional()
    .default(""),
  taskId: z
    .string()
    .optional()
    .default(""),
  reportDate: z
    .string()
    .min(1, "Report date is required"),
  yesterdayWork: z
    .string()
    .max(1000, "Yesterday work must not exceed 1000 characters")
    .trim()
    .optional()
    .default(""),
  todayWork: z
    .string()
    .min(1, "Today work is required")
    .max(1000, "Today work must not exceed 1000 characters")
    .trim(),
  tomorrowPlan: z
    .string()
    .max(1000, "Tomorrow plan must not exceed 1000 characters")
    .trim()
    .optional()
    .default(""),
  hoursWorked: z.coerce
    .number()
    .finite("Hours worked must be a valid number")
    .nonnegative("Hours worked cannot be negative")
    .max(24, "Hours worked cannot exceed 24"),
  status: z.enum(workStatusEnum, {
    message: "Please select a valid status",
  }).default("COMPLETED"),
  managerRemarks: z
    .string()
    .max(500, "Manager remarks must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
});

export const editDailyWorkReportSchema = createDailyWorkReportSchema.partial().extend({
  employeeId: z
    .string()
    .min(1, "Employee is required")
    .optional(),
  reportDate: z
    .string()
    .optional(),
  todayWork: z
    .string()
    .max(1000, "Today work must not exceed 1000 characters")
    .trim()
    .optional(),
});

export type CreateDailyWorkReportFormData = z.infer<typeof createDailyWorkReportSchema>;
export type EditDailyWorkReportFormData = z.infer<typeof editDailyWorkReportSchema>;
