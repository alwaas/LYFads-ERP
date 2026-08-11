import { useNavigate, useParams } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Swal from "sweetalert2";

import TimesheetForm from "../../components/timesheets/TimesheetForm";

import { getEmployees } from "../../services/employee.service";
import { getProjects } from "../../services/project.service";
import { getTasks } from "../../services/task.service";

import {
  getTimesheet,
  updateTimesheet,
} from "../../services/timesheet.service";

import type { CreateTimesheetPayload } from "../../types/timesheet";

export default function EditTimesheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const timesheetQuery = useQuery({
    queryKey: ["timesheet", id],
    queryFn: () => getTimesheet(id as string),
    enabled: Boolean(id),
  });

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateTimesheetPayload) =>
      updateTimesheet(id as string, data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["timesheets"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["timesheet", id],
      });

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Timesheet updated successfully.",
        timer: 1600,
        showConfirmButton: false,
      });

      navigate("/timesheets");
    },
  });

  if (
    timesheetQuery.isLoading ||
    employeesQuery.isLoading ||
    projectsQuery.isLoading ||
    tasksQuery.isLoading
  ) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading timesheet...
      </div>
    );
  }

  if (
    timesheetQuery.isError ||
    !timesheetQuery.data
  ) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Unable to load timesheet.
        </div>
      </div>
    );
  }

  const timesheet = timesheetQuery.data;

  const initialData: Partial<CreateTimesheetPayload> = {
    employeeId: timesheet.employeeId,
    projectId: timesheet.projectId ?? undefined,
    taskId: timesheet.taskId ?? undefined,
    workDate: timesheet.workDate,
    startTime: timesheet.startTime ?? undefined,
    endTime: timesheet.endTime ?? undefined,
    hours: String(timesheet.hours),
    description: timesheet.description ?? "",
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Timesheet
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update the timesheet record.
          </p>
        </div>

        <TimesheetForm
          employees={employeesQuery.data ?? []}
          projects={projectsQuery.data ?? []}
          tasks={tasksQuery.data ?? []}
          initialData={initialData}
          loading={mutation.isPending}
          submitLabel="Update Timesheet"
          onSubmit={(data) =>
            mutation.mutateAsync(data)
          }
        />
      </div>
    </div>
  );
}
