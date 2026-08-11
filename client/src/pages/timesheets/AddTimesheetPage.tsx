import { useNavigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import Swal from "sweetalert2";

import TimesheetForm from "../../components/timesheets/TimesheetForm";

import { getEmployees } from "../../services/employee.service";
import { getProjects } from "../../services/project.service";
import { getTasks } from "../../services/task.service";
import { createTimesheet } from "../../services/timesheet.service";

import type { CreateTimesheetPayload } from "../../types/timesheet";

export default function AddTimesheetPage() {
  const navigate = useNavigate();

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
    mutationFn: createTimesheet,

    onSuccess: async () => {
      await Swal.fire({
        icon: "success",
        title: "Created",
        text: "Timesheet created successfully.",
        timer: 1600,
        showConfirmButton: false,
      });

      navigate("/timesheets");
    },
  });

  const handleSubmit = async (
    data: CreateTimesheetPayload,
  ) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Add Timesheet
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record employee working hours.
          </p>
        </div>

        <TimesheetForm
          employees={employeesQuery.data ?? []}
          projects={projectsQuery.data ?? []}
          tasks={tasksQuery.data ?? []}
          loading={
            employeesQuery.isLoading ||
            projectsQuery.isLoading ||
            tasksQuery.isLoading ||
            mutation.isPending
          }
          submitLabel="Create Timesheet"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
