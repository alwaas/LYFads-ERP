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

import type { Leave } from "../../types/leave";

import type { Employee } from "../../types/employee";

import { mapServerValidationErrors } from "../../features/validation/errors";

function EditLeavePage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [leave, setLeave] = useState<Leave | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [serverErrors, setServerErrors] =
    useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadLeave(id);
    }
    loadEmployees();
  }, [id]);

  const loadLeave = async (leaveId: string) => {
    try {
      const leaveData: Leave = await getLeaveById(leaveId);
      setLeave(leaveData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leave.");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employees.");
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    if (!id || !leave) return;

    setServerErrors({});
    setSaving(true);

    try {
      await updateLeave(id, {
        leaveType: data.leaveType,
        startDate: new Date(
          data.startDate
        ).toISOString(),
        endDate: new Date(
          data.endDate
        ).toISOString(),
        reason: data.reason,
        remarks: data.remarks,
      });

      toast.success("Leave updated successfully.");

      navigate("/leaves");
    } catch (error: unknown) {
      console.error(error);

      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(
          (error as any)?.response?.data?.message ??
            "Failed to update leave."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!leave) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="text-red-600">Leave not found</div>
        </div>
      </DashboardLayout>
    );
  }

  const initialData = {
    leaveType: leave.leaveType,
    startDate: leave.startDate.slice(0, 10),
    endDate: leave.endDate.slice(0, 10),
    reason: leave.reason,
    remarks: leave.remarks ?? "",
  };

  return (
    <DashboardLayout>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">

        <h1 className="text-3xl font-bold mb-8">
          Edit Leave
        </h1>

        <LeaveForm
          initialData={initialData}
          employees={employees}
          onSubmit={handleSubmit}
          loading={saving}
          serverErrors={serverErrors}
        />

      </div>

    </DashboardLayout>
  );
}

export default EditLeavePage;
