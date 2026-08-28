export type PayrollStatus = "PENDING" | "PROCESSED" | "APPROVED" | "PAID";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE";

export type Payroll = {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  totalHours: number;
  overtimeHours: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: PayrollStatus;
  generatedAt: string | null;
  paidAt: string | null;
  allowances: number;
  esi: number;
  grossSalary: number;
  hra: number;
  incentives: number;
  overtimeAmount: number;
  payslipNo: string | null;
  pf: number;
  tds: number;
  totalDeduction: number;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedBy: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  employee: {
    id: string;
    employeeCode: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  items: {
    id: string;
    type: string;
    category: string;
    description?: string;
    amount: number;
    sequence: number;
  }[];
};
