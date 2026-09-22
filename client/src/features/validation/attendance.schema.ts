import { z } from "zod";

export const createAttendanceSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee is required"),
  remarks: z
    .string()
    .max(500, "Remarks must not exceed 500 characters")
    .trim()
    .optional()
    .default(""),
});

export const editAttendanceSchema = createAttendanceSchema.partial().extend({
  employeeId: z
    .string()
    .min(1, "Employee is required")
    .optional(),
});

export type CreateAttendanceFormData = z.infer<typeof createAttendanceSchema>;
export type EditAttendanceFormData = z.infer<typeof editAttendanceSchema>;
