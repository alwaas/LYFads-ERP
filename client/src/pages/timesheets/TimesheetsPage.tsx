import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteTimesheet,
  getTimesheets,
} from "../../services/timesheet.service";

import TimesheetStats from "../../components/timesheets/TimesheetStats";
import TimesheetTable from "../../components/timesheets/TimesheetTable";

export default function TimesheetsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const {
    data: timesheets = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["timesheets"],
    queryFn: getTimesheets,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimesheet,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["timesheets"],
      });

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Timesheet deleted successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    },

    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Unable to delete the timesheet.",
      });
    },
  });

  const filteredTimesheets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return timesheets;

    return timesheets.filter((item) => {
      const employee =
        item.employee?.user?.fullName ?? "";

      const employeeCode =
        item.employee?.employeeCode ?? "";

      const project =
        item.project?.name ?? "";

      const task =
        item.task?.title ?? "";

      return [
        employee,
        employeeCode,
        project,
        task,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [timesheets, search]);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Timesheet?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    deleteMutation.mutate(id);
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Failed to load timesheets
          </h2>

          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Timesheets
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track employee working hours and work records.
          </p>
        </div>

        <Link
          to="/timesheets/add"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Timesheet
        </Link>
      </div>

      {!isLoading && (
        <TimesheetStats timesheets={timesheets} />
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search employee, project or task..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                isFetching ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            Loading timesheets...
          </p>
        </div>
      ) : (
        <TimesheetTable
          timesheets={filteredTimesheets}
          onDelete={handleDelete}
          deletingId={
            deleteMutation.isPending
              ? deleteMutation.variables
              : null
          }
        />
      )}
    </div>
  );
}
