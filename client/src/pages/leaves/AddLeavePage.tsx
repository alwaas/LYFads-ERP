import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import LeaveForm from "../../components/leaves/LeaveForm";

import { createLeave } from "../../services/leave.service";
import { getEmployees } from "../../services/employee.service";

import type {
  CreateLeaveDto,
} from "../../types/leave";

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

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data =
        await getEmployees();

      setEmployees(data);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load employees."
      );
    }
  };

  const handleSubmit = async (
    data: CreateLeaveDto
  ) => {
    try {
      setLoading(true);

      await createLeave(data);

      toast.success(
        "Leave request created successfully."
      );

      navigate("/leaves");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ??
          "Failed to create leave."
      );
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
        />

      </div>

    </DashboardLayout>
  );
}

export default AddLeavePage;