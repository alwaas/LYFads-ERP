import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import LeaveForm, { type LeaveFormData } from "../../components/leaves/LeaveForm";

import { createLeave } from "../../services/leave.service";
import { getEmployees } from "../../services/employee.service";

import { mapServerValidationErrors } from "../../features/validation/errors";

type Employee = {
  id: string;
  employeeCode: string;
  user: {
    fullName: string;
  };
};

function AddLeavePage() {
  const navigate = useNavigate();

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [serverErrors, setServerErrors] =
    useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeeData = await getEmployees();
      setEmployees(employeeData);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load employees."
      );
    }
  };

  const handleSubmit = async (
    data: LeaveFormData
  ) => {
    setServerErrors({});
    try {
      setLoading(true);

      await createLeave({
        employeeId: data.employeeId,
        leaveType: data.leaveType as any,
        startDate: new Date(
          data.startDate
        ).toISOString(),
        endDate: new Date(
          data.endDate
        ).toISOString(),
        reason: data.reason,
        remarks: data.remarks,
      });

      toast.success(
        "Leave request created successfully."
      );

      navigate("/leaves");
    } catch (error: unknown) {
      console.error(error);

      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ??
            "Failed to create leave."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Apply Leave
        </h1>

        <LeaveForm
          employees={employees}
          onSubmit={handleSubmit}
          loading={loading}
          serverErrors={serverErrors}
        />

      </div>

    </DashboardLayout>
  );
}

export default AddLeavePage;
