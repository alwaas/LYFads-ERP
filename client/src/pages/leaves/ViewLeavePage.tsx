import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getLeaveById } from "../../services/leave.service";

import type { Leave } from "../../types/leave";

function ViewLeavePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLeave(id);
    }
  }, [id]);

  const loadLeave = async (leaveId: string) => {
    try {
      const data = await getLeaveById(leaveId);
      setLeave(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leave.");
    } finally {
      setLoading(false);
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
        <div className="text-center py-20 text-xl">
          Leave Not Found
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8 space-y-6">

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            Leave Details
          </h1>

          <button
            onClick={() => navigate("/leaves")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <Info
            label="Employee"
            value={leave.employee.user.fullName}
          />

          <Info
            label="Employee Code"
            value={leave.employee.employeeCode}
          />

          <Info
            label="Leave Type"
            value={leave.leaveType}
          />

          <Info
            label="Status"
            value={leave.status}
          />

          <Info
            label="From Date"
            value={new Date(
              leave.startDate
            ).toLocaleDateString()}
          />

          <Info
            label="To Date"
            value={new Date(
              leave.endDate
            ).toLocaleDateString()}
          />

          <Info
            label="Total Days"
            value={String(leave.totalDays)}
          />

          <Info
            label="Created"
            value={new Date(
              leave.createdAt
            ).toLocaleString()}
          />

        </div>

        <div>
          <h2 className="font-semibold mb-2">
            Reason
          </h2>

          <div className="border rounded-lg p-4 bg-gray-50">
            {leave.reason}
          </div>
        </div>

        {leave.remarks && (
          <div>
            <h2 className="font-semibold mb-2">
              Remarks
            </h2>

            <div className="border rounded-lg p-4 bg-gray-50">
              {leave.remarks}
            </div>
          </div>
        )}

        {leave.rejectionReason && (
          <div>
            <h2 className="font-semibold text-red-600 mb-2">
              Rejection Reason
            </h2>

            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              {leave.rejectionReason}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

type InfoProps = {
  label: string;
  value: string;
};

function Info({
  label,
  value,
}: InfoProps) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="font-semibold">
        {value}
      </p>
    </div>
  );
}

export default ViewLeavePage;