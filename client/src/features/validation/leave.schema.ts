import { z } from "zod";

export const leaveTypeEnum = [
  "CASUAL",
  "SICK",
  "EARNED",
  "UNPAID",
  "MATERNITY",
  "PATERNITY",
] as const;

export type LeaveType = (typeof leaveTypeEnum)[number];

export const createLeaveSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee is required"),
  leaveType: z.enum(leaveTypeEnum, {
    message: "Please select a valid leave type",
  }),
  startDate: z
    .string()
    .min(1, "Start date is required"),
  endDate: z
    .string()
    .min(1, "End date is required"),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(1000, "Reason must not exceed 1000 characters")
    .trim(),
  remarks: z
    .string()
    .max(500, "Remarks must not exceed 500 characters")
    .trim()
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

export const editLeaveSchema = createLeaveSchema.partial().extend({
  employeeId: z
    .string()
    .min(1, "Employee is required")
    .optional(),
  leaveType: z.enum(leaveTypeEnum, {
    message: "Please select a valid leave type",
  }).optional(),
  startDate: z
    .string()
    .optional(),
  endDate: z
    .string()
    .optional(),
  reason: z
    .string()
    .max(1000, "Reason must not exceed 1000 characters")
    .trim()
    .optional(),
});

export type CreateLeaveFormData = z.infer<typeof createLeaveSchema>;
export type EditLeaveFormData = z.infer<typeof editLeaveSchema>;
