import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import { checkIn } from "../../services/attendance.service";
import { getEmployees } from "../../services/employee.service";

import type { Employee } from "../../types/employee";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createAttendanceSchema, type CreateAttendanceFormData } from "../../features/validation/attendance.schema";

import { mapServerValidationErrors } from "../../features/validation/errors";

function AddAttendancePage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load employees.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateAttendanceFormData>({
    resolver: zodResolver(createAttendanceSchema) as any,
    defaultValues: {
      employeeId: "",
      remarks: "",
    },
  });

  const onSubmit = async (data: CreateAttendanceFormData) => {
    setSubmitting(true);

    try {
      await checkIn({
        employeeId: data.employeeId,
        remarks: data.remarks || undefined,
      });

      toast.success("Attendance added successfully.");
      navigate("/attendance");
    } catch (error: unknown) {
      console.error(error);

      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CreateAttendanceFormData, { message });
        });
      } else {
        const message =
          (error as any)?.response?.data?.message?.[0] ??
          (error as any)?.response?.data?.message ??
          "Failed to add attendance.";

        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Add Attendance
          </h1>

          <p className="text-gray-600 mt-1">
            Check in an employee for today.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl shadow-sm border p-6 space-y-5"
        >
          <div>
            <label className="block mb-2 font-medium">
              Employee
            </label>

            <select
              {...register("employeeId")}
              disabled={loading || submitting}
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="">
                {loading
                  ? "Loading employees..."
                  : "Select Employee"}
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
              <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Remarks
            </label>

            <textarea
              rows={4}
              {...register("remarks")}
              disabled={submitting}
              placeholder="Optional remarks..."
              className="w-full border rounded-lg px-4 py-3"
            />
            {errors.remarks && (
              <p className="mt-1 text-sm text-red-600">{errors.remarks.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : "Add Attendance"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/attendance")}
              disabled={submitting}
              className="border px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AddAttendancePage;
