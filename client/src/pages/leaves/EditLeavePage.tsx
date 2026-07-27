import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import LeaveForm from "../../components/leaves/LeaveForm";

import {
  getLeaveById,
  updateLeave,
} from "../../services/leave.service";

import { getEmployees } from "../../services/employee.service";

import type {
  Leave,
  CreateLeaveDto,
} from "../../types/leave";

type Employee = {
  id: string;
  employeeCode: string;
  user: {
    fullName: string;
  };
};

function EditLeavePage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [leave, setLeave] =
    useState<Leave>();

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [
        leaveData,
        employeeData,
      ] = await Promise.all([
        getLeaveById(id!),
        getEmployees(),
      ]);

      setLeave(leaveData);

      setEmployees(employeeData);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load leave."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    data: CreateLeaveDto
  ) => {
    try {
      setSaving(true);

      await updateLeave(id!, data);

      toast.success(
        "Leave updated successfully."
      );

      navigate("/leaves");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ??
          "Failed to update leave."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Edit Leave
        </h1>

        {loading ? (

          <div className="flex justify-center py-20">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

          </div>

        ) : (

          <LeaveForm
            initialData={leave}
            employees={employees}
            onSubmit={handleSubmit}
            loading={saving}
          />

        )}

      </div>

    </DashboardLayout>
  );
}

export default EditLeavePage;