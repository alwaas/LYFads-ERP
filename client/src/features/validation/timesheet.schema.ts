import { z } from "zod";

export const createTimesheetSchema = z.object({
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
  workDate: z
    .string()
    .min(1, "Work date is required"),
  startTime: z
    .string()
    .optional()
    .default(""),
  endTime: z
    .string()
    .optional()
    .default(""),
  hours: z.coerce
    .number()
    .finite("Hours must be a valid number")
    .nonnegative("Hours cannot be negative")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .default(""),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const editTimesheetSchema = createTimesheetSchema.partial().extend({
  employeeId: z
    .string()
    .min(1, "Employee is required")
    .optional(),
  workDate: z
    .string()
    .optional(),
});

export type CreateTimesheetFormData = z.infer<typeof createTimesheetSchema>;
export type EditTimesheetFormData = z.infer<typeof editTimesheetSchema>;
