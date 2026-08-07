import { useEffect } from "react";
import { useForm } from "react-hook-form";

export type EmployeeFormData = {
  fullName: string;
  email: string;
  password?: string;
  employeeCode: string;
  phone: string;
  department: string;
  designation: string;
  role: string;
};

type Props = {
  onSubmit: (data: EmployeeFormData) => void;
  loading?: boolean;
  defaultValues?: Partial<EmployeeFormData>;
};

function EmployeeForm({
  onSubmit,
  loading = false,
  defaultValues,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      role: "EMPLOYEE",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        role: "EMPLOYEE",
        ...defaultValues,
      });
    }
  }, [defaultValues, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Full Name */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Full Name *
          </label>
          <input
            {...register("fullName", {
              required: "Full Name is required",
            })}
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
            {...register("email", {
              required: "Email is required",
            })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter email address"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.email?.message}
          </p>
        </div>

        {/* Password (Optional on edit if not changing, required on add) */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Password {defaultValues ? "" : "*"}
          </label>
          <input
            type="password"
            {...register("password", {
              required: defaultValues ? false : "Password is required",
            })}
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
            {...register("employeeCode", {
              required: "Employee Code is required",
            })}
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