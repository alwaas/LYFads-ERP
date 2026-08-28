import { z } from "zod";

export const payrollStatusEnum = [
  "PENDING",
  "GENERATED",
  "PAID",
] as const;

export type PayrollStatus = (typeof payrollStatusEnum)[number];

const nonNegativeFiniteNumber = z.coerce
  .number()
  .finite("Must be a valid number")
  .nonnegative("Must be a positive number");

export const createPayrollSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee is required")
    .uuid("Invalid employee ID"),

  month: z.coerce
    .number()
    .int("Month must be a whole number")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),

  year: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(2000, "Year must be valid")
    .max(2100, "Year must be valid"),

  basicSalary: nonNegativeFiniteNumber,

  totalHours: nonNegativeFiniteNumber.default(0),

  overtimeHours: nonNegativeFiniteNumber.default(0),

  overtimeAmount: nonNegativeFiniteNumber.default(0),

  hra: nonNegativeFiniteNumber.default(0),

  allowances: nonNegativeFiniteNumber.default(0),

  bonus: nonNegativeFiniteNumber.default(0),

  incentives: nonNegativeFiniteNumber.default(0),

  grossSalary: nonNegativeFiniteNumber.default(0),

  pf: nonNegativeFiniteNumber.default(0),

  esi: nonNegativeFiniteNumber.default(0),

  tds: nonNegativeFiniteNumber.default(0),

  deductions: nonNegativeFiniteNumber.default(0),

  totalDeduction: nonNegativeFiniteNumber.default(0),

  netSalary: nonNegativeFiniteNumber,

  status: z.enum(payrollStatusEnum, {
    message: "Please select a valid status",
  }).default("PENDING"),

  payslipNo: z
    .string()
    .max(50, "Payslip number must not exceed 50 characters")
    .trim()
    .optional()
    .default(""),
});

export const editPayrollSchema = z.object({
  employeeId: z
    .string()
    .uuid("Invalid employee ID")
    .optional(),

  month: z.coerce
    .number()
    .int("Month must be a whole number")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12")
    .optional(),

  year: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(2000, "Year must be valid")
    .max(2100, "Year must be valid")
    .optional(),

  basicSalary: nonNegativeFiniteNumber.optional(),

  totalHours: nonNegativeFiniteNumber.optional().default(0),

  overtimeHours: nonNegativeFiniteNumber.optional().default(0),

  overtimeAmount: nonNegativeFiniteNumber.optional().default(0),

  hra: nonNegativeFiniteNumber.optional().default(0),

  allowances: nonNegativeFiniteNumber.optional().default(0),

  bonus: nonNegativeFiniteNumber.optional().default(0),

  incentives: nonNegativeFiniteNumber.optional().default(0),

  grossSalary: nonNegativeFiniteNumber.optional().default(0),

  pf: nonNegativeFiniteNumber.optional().default(0),

  esi: nonNegativeFiniteNumber.optional().default(0),

  tds: nonNegativeFiniteNumber.optional().default(0),

  deductions: nonNegativeFiniteNumber.optional().default(0),

  totalDeduction: nonNegativeFiniteNumber.optional().default(0),

  netSalary: nonNegativeFiniteNumber.optional(),

  status: z.enum(payrollStatusEnum, {
    message: "Please select a valid status",
  }).optional().default("PENDING"),

  payslipNo: z
    .string()
    .max(50, "Payslip number must not exceed 50 characters")
    .trim()
    .optional()
    .default(""),
});

export type CreatePayrollFormData = z.infer<typeof createPayrollSchema>;
export type EditPayrollFormData = z.infer<typeof editPayrollSchema>;
