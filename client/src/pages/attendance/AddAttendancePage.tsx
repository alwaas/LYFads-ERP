import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import { checkIn } from "../../services/attendance.service";
import { getEmployees } from "../../services/employee.service";

import type { Employee } from "../../types/employee";

function AddAttendancePage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [remarks, setRemarks] = useState("");
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

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!employeeId) {
      toast.error("Please select an employee.");
      return;
    }

    try {
      setSubmitting(true);

      await checkIn({
        employeeId,
        remarks: remarks.trim() || undefined,
      });

      toast.success("Attendance added successfully.");
      navigate("/attendance");
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message?.[0] ??
        error?.response?.data?.message ??
        "Failed to add attendance.";

      toast.error(message);
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
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border p-6 space-y-5"
        >
          <div>
            <label className="block mb-2 font-medium">
              Employee
            </label>

            <select
              value={employeeId}
              onChange={(event) =>
                setEmployeeId(event.target.value)
              }
              disabled={loading || submitting}
              className="w-full border rounded-lg px-4 py-3"
              required
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
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Remarks
            </label>

            <textarea
              rows={4}
              value={remarks}
              onChange={(event) =>
                setRemarks(event.target.value)
              }
              disabled={submitting}
              placeholder="Optional remarks..."
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={
                loading ||
                submitting ||
                !employeeId
              }
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