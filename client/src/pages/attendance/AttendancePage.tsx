import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import AttendanceStats from "../../components/attendance/AttendanceStats";
import AttendanceTable from "../../components/attendance/AttendanceTable";

import {
  getTodayAttendance,
} from "../../services/attendance.service";

import type { Attendance } from "../../types/attendance";

function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const data =
        await getTodayAttendance();

      setAttendance(data);
    } catch (err) {
      console.error(err);

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

          <h1 className="text-3xl font-bold">
            Attendance Dashboard
          </h1>

        </div>

        <AttendanceStats
          attendance={attendance}
        />

        {loading ? (

          <div className="flex justify-center py-16">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

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