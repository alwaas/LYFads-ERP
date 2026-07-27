import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import AttendanceTable from "../../components/attendance/AttendanceTable";

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

  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    fromDate,
    toDate,
  ]);

  const loadHistory = async () => {
    try {
      const data = await getAttendanceHistory();

      setAttendance(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to load attendance history."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      const employeeName =
        item.employee.user.fullName.toLowerCase();

      const employeeCode =
        item.employee.employeeCode.toLowerCase();

      const matchesSearch =
        employeeName.includes(
          search.toLowerCase()
        ) ||
        employeeCode.includes(
          search.toLowerCase()
        );

      const matchesStatus =
        statusFilter === "" ||
        item.status === statusFilter;

      const attendanceDate = new Date(
        item.date
      );

      const matchesFromDate =
        fromDate === "" ||
        attendanceDate >= new Date(fromDate);

      const matchesToDate =
        toDate === "" ||
        attendanceDate <=
          new Date(`${toDate}T23:59:59`);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    attendance,
    search,
    statusFilter,
    fromDate,
    toDate,
  ]);

  const totalPages = Math.ceil(
    filteredAttendance.length /
      rowsPerPage
  );

  const paginatedAttendance =
    filteredAttendance.slice(
      (currentPage - 1) *
        rowsPerPage,
      currentPage *
        rowsPerPage
    );

  const exportCSV = () => {
    if (filteredAttendance.length === 0) {
      toast.error(
        "No attendance records to export."
      );
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

    const rows =
      filteredAttendance.map((item) => [
        item.employee.user.fullName,
        item.employee.employeeCode,
        new Date(item.date).toLocaleDateString(),
        item.checkIn
          ? new Date(
              item.checkIn
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        item.checkOut
          ? new Date(
              item.checkOut
            ).toLocaleTimeString([], {
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

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "attendance-history.csv";

    link.click();

    URL.revokeObjectURL(url);

    toast.success(
      "CSV exported successfully."
    );
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
              setSearch(e.target.value)
            }
            className="border rounded-lg px-4 py-3"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
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
              setFromDate(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              setToDate(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3"
          />

        </div>

        {loading ? (

          <div className="flex justify-center py-16">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

          </div>

        ) : (

          <>
            <AttendanceTable
              attendance={paginatedAttendance}
            />

            {totalPages > 1 && (

              <div className="flex justify-center items-center gap-2 mt-6">

                <button
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        page - 1
                    )
                  }
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="font-medium">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        page + 1
                    )
                  }
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>

              </div>

            )}

          </>

        )}

      </div>

    </DashboardLayout>
  );
}

export default AttendanceHistoryPage;