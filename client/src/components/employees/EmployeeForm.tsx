import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createEmployeeSchema,
  editEmployeeSchema,
  type CreateEmployeeFormData,
  type EditEmployeeFormData,
} from "../../features/validation/employee.schema";

type Props = {
  onSubmit: (data: CreateEmployeeFormData | EditEmployeeFormData) => void;
  loading?: boolean;
  defaultValues?: Partial<CreateEmployeeFormData | EditEmployeeFormData>;
  serverErrors?: Record<string, string>;
  managers?: { id: string; user: { fullName: string } }[];
};

type FormData = CreateEmployeeFormData | EditEmployeeFormData;

function EmployeeForm({
  onSubmit,
  loading = false,
  defaultValues,
  serverErrors,
  managers = [],
}: Props) {
  const schema = defaultValues ? editEmployeeSchema : createEmployeeSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      role: "EMPLOYEE",
      fullName: defaultValues?.fullName || "",
      email: defaultValues?.email || "",
      employeeCode: defaultValues?.employeeCode || "",
      phone: defaultValues?.phone || "",
      department: defaultValues?.department || "",
      designation: defaultValues?.designation || "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        role: defaultValues.role || "EMPLOYEE",
        fullName: defaultValues.fullName || "",
        email: defaultValues.email || "",
        employeeCode: defaultValues.employeeCode || "",
        phone: defaultValues.phone || "",
        department: defaultValues.department || "",
        designation: defaultValues.designation || "",
        status: defaultValues.status || "ACTIVE",
        managerId: defaultValues.managerId || "",
        bankName: defaultValues.bankName || "",
        bankAccountNumber: defaultValues.bankAccountNumber || "",
        ifscCode: defaultValues.ifscCode || "",
        emergencyContactName: defaultValues.emergencyContactName || "",
        emergencyContactPhone: defaultValues.emergencyContactPhone || "",
        ...defaultValues,
      });
    }
  }, [defaultValues, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Full Name *
          </label>
          <input
            {...register("fullName")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter full name"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.fullName?.message}
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Email *
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter email address"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.email?.message}
          </p>
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Password {defaultValues ? "" : "*"}
          </label>
          <input
            type="password"
            {...register("password")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder={defaultValues ? "Leave blank to keep unchanged" : "Enter password"}
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.password?.message}
          </p>
        </div>

        {/* Employee Code */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Employee Code *
          </label>
          <input
            {...register("employeeCode")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter employee code"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.employeeCode?.message}
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Phone
          </label>
          <input
            {...register("phone")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter phone number"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.phone?.message}
          </p>
        </div>

        {/* Department */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Department
          </label>
          <input
            {...register("department")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter department"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.department?.message}
          </p>
        </div>

        {/* Designation */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Designation
          </label>
          <input
            {...register("designation")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter designation"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.designation?.message}
          </p>
        </div>

        {/* Role */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Role
          </label>
          <select
            {...register("role")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="CLIENT">CLIENT</option>
          </select>
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.role?.message}
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            {...register("status")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="">Select Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="ON_LEAVE">ON_LEAVE</option>
            <option value="PROBATION">PROBATION</option>
            <option value="NOTICE_PERIOD">NOTICE_PERIOD</option>
          </select>
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.status?.message}
          </p>
        </div>

        {/* Manager */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Manager
          </label>
          <select
            {...register("managerId")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white"
          >
            <option value="">Select Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.user.fullName}
              </option>
            ))}
          </select>
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.managerId?.message}
          </p>
        </div>

        {/* Bank Name */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Bank Name
          </label>
          <input
            {...register("bankName")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter bank name"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.bankName?.message}
          </p>
        </div>

        {/* Bank Account Number */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Bank Account Number
          </label>
          <input
            {...register("bankAccountNumber")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter bank account number"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.bankAccountNumber?.message}
          </p>
        </div>

        {/* IFSC Code */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            IFSC Code
          </label>
          <input
            {...register("ifscCode")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter IFSC code"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.ifscCode?.message}
          </p>
        </div>

        {/* Emergency Contact Name */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Emergency Contact Name
          </label>
          <input
            {...register("emergencyContactName")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter emergency contact name"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.emergencyContactName?.message}
          </p>
        </div>

        {/* Emergency Contact Phone */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Emergency Contact Phone
          </label>
          <input
            {...register("emergencyContactPhone")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter emergency contact phone"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.emergencyContactPhone?.message}
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? "Saving..." : "Save Employee"}
        </button>
      </div>
    </form>
  );
}

export default EmployeeForm;
