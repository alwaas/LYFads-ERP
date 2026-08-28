import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { createPayrollSchema, editPayrollSchema } from "../../features/validation/payroll.schema";

type Props = {
  loading?: boolean;
  onSubmit: (values: { employeeId: string; month: number; year: number; basicSalary: number; totalHours: number; overtimeHours: number; overtimeAmount: number; hra: number; allowances: number; bonus: number; incentives: number; grossSalary: number; pf: number; esi: number; tds: number; deductions: number; totalDeduction: number; netSalary: number; status?: string; payslipNo?: string }) => void | Promise<void>;
  initialData?: { employeeId?: string; month?: number; year?: number; basicSalary?: number; totalHours?: number; overtimeHours?: number; overtimeAmount?: number; hra?: number; allowances?: number; bonus?: number; incentives?: number; grossSalary?: number; pf?: number; esi?: number; tds?: number; deductions?: number; totalDeduction?: number; netSalary?: number; status?: string; payslipNo?: string };
  isEdit?: boolean;
  serverErrors?: Record<string, string>;
};

type FormData = {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  totalHours: number;
  overtimeHours: number;
  overtimeAmount: number;
  hra: number;
  allowances: number;
  bonus: number;
  incentives: number;
  grossSalary: number;
  pf: number;
  esi: number;
  tds: number;
  deductions: number;
  totalDeduction: number;
  netSalary: number;
  status?: string;
  payslipNo?: string;
};

function PayrollForm({ loading, onSubmit, initialData, isEdit, serverErrors }: Props) {
  const schema = isEdit ? editPayrollSchema : createPayrollSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      employeeId: initialData?.employeeId || "",
      month: initialData?.month || new Date().getMonth() + 1,
      year: initialData?.year || new Date().getFullYear(),
      basicSalary: initialData?.basicSalary ?? 0,
      totalHours: initialData?.totalHours ?? 0,
      overtimeHours: initialData?.overtimeHours ?? 0,
      overtimeAmount: initialData?.overtimeAmount ?? 0,
      hra: initialData?.hra ?? 0,
      allowances: initialData?.allowances ?? 0,
      bonus: initialData?.bonus ?? 0,
      incentives: initialData?.incentives ?? 0,
      grossSalary: initialData?.grossSalary ?? 0,
      pf: initialData?.pf ?? 0,
      esi: initialData?.esi ?? 0,
      tds: initialData?.tds ?? 0,
      deductions: initialData?.deductions ?? 0,
      totalDeduction: initialData?.totalDeduction ?? 0,
      netSalary: initialData?.netSalary ?? 0,
      status: initialData?.status || "PENDING",
      payslipNo: initialData?.payslipNo || "",
    },
  });

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Employee ID</label>
          <input
            {...register("employeeId")}
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter employee ID"
          />
          {errors.employeeId && (
            <p className="mt-1 text-xs text-red-600">{errors.employeeId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Month</label>
          <input
            {...register("month")}
            type="number"
            min="1"
            max="12"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.month && (
            <p className="mt-1 text-xs text-red-600">{errors.month.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Year</label>
          <input
            {...register("year")}
            type="number"
            min="2000"
            max="2100"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.year && (
            <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Basic Salary</label>
          <input
            {...register("basicSalary")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.basicSalary && (
            <p className="mt-1 text-xs text-red-600">{errors.basicSalary.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Total Hours</label>
          <input
            {...register("totalHours")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Overtime Hours</label>
          <input
            {...register("overtimeHours")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Overtime Amount</label>
          <input
            {...register("overtimeAmount")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">HRA</label>
          <input
            {...register("hra")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Allowances</label>
          <input
            {...register("allowances")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Bonus</label>
          <input
            {...register("bonus")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Incentives</label>
          <input
            {...register("incentives")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Gross Salary</label>
          <input
            {...register("grossSalary")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">PF</label>
          <input
            {...register("pf")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">ESI</label>
          <input
            {...register("esi")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">TDS</label>
          <input
            {...register("tds")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Deductions</label>
          <input
            {...register("deductions")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Total Deduction</label>
          <input
            {...register("totalDeduction")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Net Salary</label>
          <input
            {...register("netSalary")}
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.netSalary && (
            <p className="mt-1 text-xs text-red-600">{errors.netSalary.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            {...register("status")}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="PENDING">Pending</option>
            <option value="GENERATED">Generated</option>
            <option value="PAID">Paid</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Payslip No</label>
          <input
            {...register("payslipNo")}
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Payroll" : "Create Payroll"}
        </button>
      </div>
    </form>
  );
}

export default PayrollForm;
