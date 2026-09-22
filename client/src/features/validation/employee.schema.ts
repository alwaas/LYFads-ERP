import { z } from "zod";

export const userRoleEnum = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
  "CLIENT",
] as const;

export type UserRole = (typeof userRoleEnum)[number];

export const employmentStatusEnum = [
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "PROBATION",
  "NOTICE_PERIOD",
] as const;

export type EmploymentStatus = (typeof employmentStatusEnum)[number];

export const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must not exceed 100 characters")
    .trim(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must not exceed 50 characters"),

  employeeCode: z
    .string()
    .min(1, "Employee code is required")
    .max(50, "Employee code must not exceed 50 characters")
    .trim(),

  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^[+]?[\d\s\-().]+$/, "Please enter a valid phone number")
    .optional()
    .default(""),

  department: z
    .string()
    .max(100, "Department must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  designation: z
    .string()
    .max(100, "Designation must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  role: z.enum(userRoleEnum, {
    message: "Please select a valid role",
  }).default("EMPLOYEE"),

  status: z.enum(employmentStatusEnum, {
    message: "Please select a valid status",
  }).optional(),

  managerId: z
    .string()
    .optional()
    .default(""),

  bankName: z
    .string()
    .max(100, "Bank name must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  bankAccountNumber: z
    .string()
    .max(30, "Bank account number must not exceed 30 characters")
    .trim()
    .optional()
    .default(""),

  ifscCode: z
    .string()
    .max(20, "IFSC code must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),

  emergencyContactName: z
    .string()
    .max(100, "Emergency contact name must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  emergencyContactPhone: z
    .string()
    .max(20, "Emergency contact phone must not exceed 20 characters")
    .regex(/^[+]?[\d\s\-().]+$/, "Please enter a valid phone number")
    .optional()
    .default(""),
});

export const editEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim()
    .optional(),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must not exceed 100 characters")
    .trim()
    .optional(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must not exceed 50 characters")
    .optional()
    .default(""),

  employeeCode: z
    .string()
    .min(1, "Employee code is required")
    .max(50, "Employee code must not exceed 50 characters")
    .trim()
    .optional(),

  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^[+]?[\d\s\-().]+$/, "Please enter a valid phone number")
    .optional()
    .default(""),

  department: z
    .string()
    .max(100, "Department must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  designation: z
    .string()
    .max(100, "Designation must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  role: z.enum(userRoleEnum, {
    message: "Please select a valid role",
  }).optional(),

  status: z.enum(employmentStatusEnum, {
    message: "Please select a valid status",
  }).optional(),

  managerId: z
    .string()
    .optional()
    .default(""),

  bankName: z
    .string()
    .max(100, "Bank name must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  bankAccountNumber: z
    .string()
    .max(30, "Bank account number must not exceed 30 characters")
    .trim()
    .optional()
    .default(""),

  ifscCode: z
    .string()
    .max(20, "IFSC code must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),

  emergencyContactName: z
    .string()
    .max(100, "Emergency contact name must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),

  emergencyContactPhone: z
    .string()
    .max(20, "Emergency contact phone must not exceed 20 characters")
    .regex(/^[+]?[\d\s\-().]+$/, "Please enter a valid phone number")
    .optional()
    .default(""),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
export type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

export const selfProfileSchema = z.object({
  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^[+]?[\d\s\-().]+$/, "Please enter a valid phone number")
    .optional()
    .default(""),
  department: z
    .string()
    .max(100, "Department must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),
  designation: z
    .string()
    .max(100, "Designation must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),
  address: z
    .string()
    .max(200, "Address must not exceed 200 characters")
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
  bankName: z
    .string()
    .max(100, "Bank name must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),
  bankAccountNumber: z
    .string()
    .max(30, "Bank account number must not exceed 30 characters")
    .trim()
    .optional()
    .default(""),
  ifscCode: z
    .string()
    .max(20, "IFSC code must not exceed 20 characters")
    .trim()
    .optional()
    .default(""),
  emergencyContactName: z
    .string()
    .max(100, "Emergency contact name must not exceed 100 characters")
    .trim()
    .optional()
    .default(""),
  emergencyContactPhone: z
    .string()
    .max(20, "Emergency contact phone must not exceed 20 characters")
    .regex(/^[+]?[\d\s\-().]+$/, "Please enter a valid phone number")
    .optional()
    .default(""),
});

export type SelfProfileFormData = z.infer<typeof selfProfileSchema>;
