import { useEffect, useState } from "react";

import type {
  CreateLeaveDto,
  Leave,
  LeaveType,
} from "../../types/leave";

type Props = {
  initialData?: Partial<Leave>;
  employees: {
    id: string;
    employeeCode: string;
    user: {
      fullName: string;
    };
  }[];
  onSubmit: (data: CreateLeaveDto) => void;
  loading?: boolean;
};

function LeaveForm({
  initialData,
  employees,
  onSubmit,
  loading = false,
}: Props) {
  const [formData, setFormData] =
    useState<CreateLeaveDto>({
      employeeId: "",
      leaveType: "CASUAL",
      fromDate: "",
      toDate: "",
      reason: "",
    });

  useEffect(() => {
    if (!initialData) return;

    setFormData({
      employeeId:
        initialData.employeeId ?? "",
      leaveType:
        (initialData.leaveType as LeaveType) ??
        "CASUAL",
      fromDate:
        initialData.fromDate?.split("T")[0] ??
        "",
      toDate:
        initialData.toDate?.split("T")[0] ??
        "",
      reason:
        initialData.reason ?? "",
    });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow border p-6 space-y-5"
    >

      <div>

        <label className="block mb-2 font-medium">
          Employee
        </label>

        <select
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
          required
        >
          <option value="">
            Select Employee
          </option>

          {employees.map(
            (employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.employeeCode}
                {" - "}
                {
                  employee.user
                    .fullName
                }
              </option>
            )
          )}

        </select>

      </div>

      <div>

        <label className="block mb-2 font-medium">
          Leave Type
        </label>

        <select
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
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

      </div>

      <div className="grid md:grid-cols-2 gap-5">

        <div>

          <label className="block mb-2 font-medium">
            From Date
          </label>

          <input
            type="date"
            name="fromDate"
            value={formData.fromDate}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
            required
          />

        </div>

        <div>

          <label className="block mb-2 font-medium">
            To Date
          </label>

          <input
            type="date"
            name="toDate"
            value={formData.toDate}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
            required
          />

        </div>

      </div>

      <div>

        <label className="block mb-2 font-medium">
          Reason
        </label>

        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={5}
          className="w-full border rounded-lg px-4 py-3"
          required
        />

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