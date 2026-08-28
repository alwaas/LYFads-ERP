import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import DailyWorkReportTable from "../../components/daily-work-reports/DailyWorkReportTable";
import DailyWorkReportStats from "../../components/daily-work-reports/DailyWorkReportStats";
import Pagination from "../../components/ui/Pagination";

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

  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadReports = async () => {
    try {
      setLoading(true);
      const result: any = await getDailyWorkReports(page, limit, search, status);
      setReports(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [page, limit, search, status]);

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

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

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
              handleSearch(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3"
          />

          <select
            value={status}
            onChange={(e) =>
              handleStatusChange(
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

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Reports Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {search || status ? "No reports match your search criteria." : "Start by adding your first report."}
            </p>
          </div>
        ) : (
          <DailyWorkReportTable
            reports={
              reports
            }
            onDelete={
              handleDelete
            }
          />
        )}

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

      </div>
    </DashboardLayout>
  );
}

export default DailyWorkReportsPage;
