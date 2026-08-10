import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import AttendanceStats from "../../components/attendance/AttendanceStats";
import AttendanceTable from "../../components/attendance/AttendanceTable";

import {
  getTodayAttendance,
} from "../../services/attendance.service";

import type { Attendance } from "../../types/attendance";

function AttendancePage() {
  const navigate = useNavigate();

  const [attendance, setAttendance] =
    useState<Attendance[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);

      const data = await getTodayAttendance();

      setAttendance(data);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Attendance Dashboard
            </h1>

            <p className="text-gray-600 mt-1">
              Manage today's employee attendance.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/attendance/add")
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
          >
            + Add Attendance
          </button>
        </div>

        <AttendanceStats
          attendance={attendance}
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <AttendanceTable
            attendance={attendance}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default AttendancePage;