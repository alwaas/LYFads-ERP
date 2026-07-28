import { useForm } from "react-hook-form";

type EmployeeFormData = {
  fullName: string;
  email: string;
  password: string;
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
  formState: { errors },
} = useForm<EmployeeFormData>({
  defaultValues: {
    role: "EMPLOYEE",
    ...defaultValues,
  },
});

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl shadow-md p-6 space-y-6"
    >
      <h2 className="text-2xl font-bold">
        Add Employee
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Full Name */}

        <div>
          <label className="block mb-2 font-medium">
            Full Name
          </label>

          <input
            {...register("fullName", {
              required: "Full Name is required",
            })}
            className="w-full border rounded-lg px-4 py-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.fullName?.message}
          </p>
        </div>

        {/* Email */}

        <div>
          <label className="block mb-2 font-medium">
            Email
          </label>

          <input
            type="email"
            {...register("email", {
              required: "Email is required",
            })}
            className="w-full border rounded-lg px-4 py-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.email?.message}
          </p>
        </div>

        {/* Password */}

        <div>
          <label className="block mb-2 font-medium">
            Password
          </label>

          <input
            type="password"
            {...register("password", {
              required: "Password is required",
            })}
            className="w-full border rounded-lg px-4 py-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.password?.message}
          </p>
        </div>

        {/* Employee Code */}

        <div>
          <label className="block mb-2 font-medium">
            Employee Code
          </label>

          <input
            {...register("employeeCode", {
              required: "Employee Code is required",
            })}
            className="w-full border rounded-lg px-4 py-3"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.employeeCode?.message}
          </p>
        </div>

        {/* Phone */}

        <div>
          <label className="block mb-2 font-medium">
            Phone
          </label>

          <input
            {...register("phone")}
            className="w-full border rounded-lg px-4 py-3"
          />
        </div>

        {/* Department */}

        <div>
          <label className="block mb-2 font-medium">
            Department
          </label>

          <input
            {...register("department")}
            className="w-full border rounded-lg px-4 py-3"
          />
        </div>

        {/* Designation */}

        <div>
          <label className="block mb-2 font-medium">
            Designation
          </label>

          <input
            {...register("designation")}
            className="w-full border rounded-lg px-4 py-3"
          />
        </div>

        {/* Role */}

        <div>
          <label className="block mb-2 font-medium">
            Role
          </label>

          <select
            {...register("role")}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="SUPER_ADMIN">
              SUPER_ADMIN
            </option>

            <option value="ADMIN">
              ADMIN
            </option>

            <option value="MANAGER">
              MANAGER
            </option>

            <option value="EMPLOYEE">
              EMPLOYEE
            </option>

            <option value="CLIENT">
              CLIENT
            </option>
          </select>
        </div>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Employee"}
      </button>

    </form>
  );
}

export default EmployeeForm;

export type { EmployeeFormData };