import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import {
  getLeaveById,
  updateLeave,
} from "../../services/leave.service";

import type { Leave } from "../../types/leave";

function EditLeavePage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
//   const [employeeId, setEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
    remarks: "",
  });

  useEffect(() => {
    if (id) {
      loadLeave(id);
    }
  }, [id]);

  const loadLeave = async (leaveId: string) => {
    try {
      const leave: Leave = await getLeaveById(leaveId);

    //   setEmployeeId(leave.employeeId);

      setForm({
        leaveType: leave.leaveType,
        fromDate: leave.startDate.slice(0, 10),
        toDate: leave.endDate.slice(0, 10),
        reason: leave.reason,
        remarks: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leave.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!id) return;

    setSaving(true);

    try {
        await updateLeave(id, {
            leaveType: form.leaveType as any,
            startDate: `${form.fromDate}T00:00:00.000Z`,
            endDate: `${form.toDate}T00:00:00.000Z`,
            reason: form.reason,
            remarks: form.remarks,
        });

        toast.success("Leave updated successfully.");

      navigate("/leaves");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update leave.");
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

  return (
    <DashboardLayout>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">

        <h1 className="text-3xl font-bold mb-8">
          Edit Leave
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div>

            <label className="block mb-2 font-medium">
              Leave Type
            </label>

            <select
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="CASUAL">Casual</option>
              <option value="SICK">Sick</option>
              <option value="EARNED">Earned</option>
              <option value="UNPAID">Unpaid</option>
              <option value="MATERNITY">Maternity</option>
              <option value="PATERNITY">Paternity</option>
            </select>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div>

              <label className="block mb-2 font-medium">
                From Date
              </label>

              <input
                type="date"
                name="fromDate"
                value={form.fromDate}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3"
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                To Date
              </label>

              <input
                type="date"
                name="toDate"
                value={form.toDate}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3"
              />

            </div>

          </div>

          <div>

            <label className="block mb-2 font-medium">
              Reason
            </label>

            <textarea
              rows={4}
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-medium">
              Remarks
            </label>

            <textarea
              rows={3}
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />

          </div>

          <div className="flex gap-4">

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Leave"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/leaves")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
            >
              Cancel
            </button>

          </div>

        </form>

      </div>

    </DashboardLayout>
  );
}

export default EditLeavePage;