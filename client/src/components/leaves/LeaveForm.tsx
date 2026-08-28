import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createLeaveSchema, editLeaveSchema, type CreateLeaveFormData, type EditLeaveFormData } from "../../features/validation/leave.schema";

export type LeaveFormData = {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  remarks?: string;
};

type Props = {
  initialData?: Partial<LeaveFormData>;
  employees: {
    id: string;
    employeeCode: string;
    user: {
      fullName: string;
    };
  }[];
  onSubmit: (data: LeaveFormData) => void;
  loading?: boolean;
  serverErrors?: Record<string, string>;
};

type FormData = CreateLeaveFormData | EditLeaveFormData;

function LeaveForm({
  initialData,
  employees,
  onSubmit,
  loading = false,
  serverErrors,
}: Props) {
  const schema = initialData ? editLeaveSchema : createLeaveSchema;

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
      employeeId: "",
      leaveType: "CASUAL",
      startDate: "",
      endDate: "",
      reason: "",
      remarks: "",
    },
  });

  useEffect(() => {
    if (!initialData) return;

    reset({
      employeeId: initialData.employeeId ?? "",
      leaveType: (initialData.leaveType as FormData["leaveType"]) ?? "CASUAL",
      startDate: initialData.startDate?.split("T")[0] ?? "",
      endDate: initialData.endDate?.split("T")[0] ?? "",
      reason: initialData.reason ?? "",
      remarks: initialData.remarks ?? "",
    });
  }, [initialData, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as unknown as LeaveFormData);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      <div>
        <label className="block mb-2 font-medium">
          Employee
        </label>

        <select
          {...register("employeeId")}
          className="w-full border rounded-lg px-4 py-3"
          disabled={loading}
        >
          <option value="">
            Select Employee
          </option>

          {employees.map((employee) => (
            <option
              key={employee.id}
              value={employee.id}
            >
              {employee.employeeCode} -{" "}
              {employee.user.fullName}
            </option>
          ))}
        </select>
        {errors.employeeId && (
          <p className="mt-1 text-sm text-red-600">
            {errors.employeeId.message}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 font-medium">
          Leave Type
        </label>

        <select
          {...register("leaveType")}
          className="w-full border rounded-lg px-4 py-3"
          disabled={loading}
        >
          <option value="CASUAL">
            Casual Leave
          </option>
          <option value="SICK">
            Sick Leave
          </option>
          <option value="EARNED">
            Earned Leave
          </option>
          <option value="UNPAID">
            Unpaid Leave
          </option>
          <option value="MATERNITY">
            Maternity Leave
          </option>
          <option value="PATERNITY">
            Paternity Leave
          </option>
        </select>
        {errors.leaveType && (
          <p className="mt-1 text-sm text-red-600">
            {errors.leaveType.message}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block mb-2 font-medium">
            From Date
          </label>

          <input
            type="date"
            {...register("startDate")}
            className="w-full border rounded-lg px-4 py-3"
            disabled={loading}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-2 font-medium">
            To Date
          </label>

          <input
            type="date"
            {...register("endDate")}
            className="w-full border rounded-lg px-4 py-3"
            disabled={loading}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.endDate.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block mb-2 font-medium">
          Reason
        </label>

        <textarea
          {...register("reason")}
          rows={5}
          className="w-full border rounded-lg px-4 py-3"
          disabled={loading}
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">
            {errors.reason.message}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 font-medium">
          Remarks
        </label>

        <textarea
          {...register("remarks")}
          rows={3}
          className="w-full border rounded-lg px-4 py-3"
          disabled={loading}
        />
        {errors.remarks && (
          <p className="mt-1 text-sm text-red-600">
            {errors.remarks.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : "Save Leave"}
      </button>
    </form>
  );
}

export default LeaveForm;
