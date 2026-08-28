import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import AttendanceTable from "../../components/attendance/AttendanceTable";
import Pagination from "../../components/ui/Pagination";

import {
  getAttendanceHistory,
} from "../../services/attendance.service";

import type { Attendance } from "../../types/attendance";

function AttendanceHistoryPage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadHistory = async () => {
    try {
      const result: any = await getAttendanceHistory(page, limit, search, statusFilter, fromDate, toDate);
      setAttendance(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance history.");
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, limit, search, statusFilter, fromDate, toDate]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setPage(1);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setPage(1);
  };

  const exportCSV = () => {
    if (attendance.length === 0) {
      toast.error("No attendance records to export.");
      return;
    }

    const headers = [
      "Employee Name",
      "Employee Code",
      "Date",
      "Check In",
      "Check Out",
      "Working Hours",
      "Status",
    ];

    const rows = attendance.map((item) => [
      item.employee.user.fullName,
      item.employee.employeeCode,
      new Date(item.date).toLocaleDateString(),
      item.checkIn
        ? new Date(item.checkIn).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      item.checkOut
        ? new Date(item.checkOut).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      item.workingHours ?? "-",
      item.status,
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${value}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-history.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully.");
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <h1 className="text-3xl font-bold">
            Attendance History
          </h1>

          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
          >
            Export CSV
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <input
            type="text"
            placeholder="Search Employee..."
            value={search}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
            className="border rounded-lg px-4 py-3"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              handleStatusChange(e.target.value)
            }
            className="border rounded-lg px-4 py-3"
          >
            <option value="">
              All Status
            </option>

            <option value="PRESENT">
              PRESENT
            </option>

            <option value="ABSENT">
              ABSENT
            </option>

            <option value="HALF_DAY">
              HALF DAY
            </option>

            <option value="LEAVE">
              LEAVE
            </option>

          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) =>
              handleFromDateChange(e.target.value)
            }
            className="border rounded-lg px-4 py-3"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              handleToDateChange(e.target.value)
            }
            className="border rounded-lg px-4 py-3"
          />

        </div>

        {loading ? (

          <div className="flex justify-center py-16">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

          </div>

        ) : attendance.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No attendance records found.</p>
          </div>
        ) : (

          <>
            <AttendanceTable
              attendance={attendance}
            />

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />

          </>

        )}

      </div>

    </DashboardLayout>
  );
}

export default AttendanceHistoryPage;
