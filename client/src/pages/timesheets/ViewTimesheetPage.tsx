import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getTimesheet } from "../../services/timesheet.service";

export default function ViewTimesheetPage() {
  const { id } = useParams();

  const {
    data: timesheet,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["timesheet", id],
    queryFn: () => getTimesheet(id as string),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading timesheet...
      </div>
    );
  }

  if (isError || !timesheet) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Timesheet not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/timesheets"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Timesheets
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Timesheet Details
          </h1>
        </div>

        <Link
          to={`/timesheets/edit/${timesheet.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Pencil size={17} />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Employee
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {timesheet.employee?.user?.fullName ||
              "-"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {timesheet.employee?.employeeCode || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Work Date
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {new Date(
              timesheet.workDate,
            ).toLocaleDateString()}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Project
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {timesheet.project?.name || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Task
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {timesheet.task?.title || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Start Time
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {timesheet.startTime
              ? new Date(
                  timesheet.startTime,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            End Time
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {timesheet.endTime
              ? new Date(
                  timesheet.endTime,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-sm text-gray-500">
            Total Hours
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {Number(timesheet.hours || 0).toFixed(2)}
            {" "}
            hours
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-sm text-gray-500">
            Description
          </p>

          <p className="mt-2 whitespace-pre-wrap text-gray-800">
            {timesheet.description || "No description provided."}
          </p>
        </div>
      </div>
    </div>
  );
}
