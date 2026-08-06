import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import DailyWorkReportTable from "../../components/daily-work-reports/DailyWorkReportTable";
import DailyWorkReportStats from "../../components/daily-work-reports/DailyWorkReportStats";

import {
  getDailyWorkReports,
  deleteDailyWorkReport,
} from "../../services/daily-work-report.service";

import type { DailyWorkReport } from "../../types/daily-work-report";

function DailyWorkReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<
    DailyWorkReport[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [page, setPage] =
    useState(1);

  const rowsPerPage = 10;

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data =
        await getDailyWorkReports();

      setReports(data);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    id: string
  ) => {
    if (
      !window.confirm(
        "Delete this report?"
      )
    )
      return;

    try {
      await deleteDailyWorkReport(id);

      toast.success(
        "Report deleted."
      );

      loadReports();
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ??
          "Delete failed."
      );
    }
  };

  const filteredReports =
    useMemo(() => {
      return reports.filter(
        (report) => {
          const matchesSearch =
            report.employee.user.fullName
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            report.employee.employeeCode
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesStatus =
            status === "" ||
            report.status === status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      reports,
      search,
      status,
    ]);

  const totalPages = Math.ceil(
    filteredReports.length / rowsPerPage
  );

  const paginatedReports =
    filteredReports.slice(
      (page - 1) * rowsPerPage,
      page * rowsPerPage
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Daily Work Reports
          </h1>

          <button
            onClick={() =>
              navigate(
                "/daily-work-reports/add"
              )
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            + Add Report
          </button>

        </div>

        <DailyWorkReportStats
          reports={reports}
        />

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Search Employee..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3"
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3"
          >
            <option value="">
              All Status
            </option>

            <option value="PLANNED">
              Planned
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="BLOCKED">
              Blocked
            </option>

          </select>

        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <DailyWorkReportTable
            reports={
              paginatedReports
            }
            onDelete={
              handleDelete
            }
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-4">

            <button
              disabled={
                page === 1
              }
              onClick={() =>
                setPage(
                  page - 1
                )
              }
              className="border px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>

            <span className="font-semibold">
              Page {page} of{" "}
              {totalPages}
            </span>

            <button
              disabled={
                page ===
                totalPages
              }
              onClick={() =>
                setPage(
                  page + 1
                )
              }
              className="border px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Next
            </button>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default DailyWorkReportsPage;