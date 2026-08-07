import {
  Mail,
  Phone,
  Briefcase,
  Building2,
  Shield,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Employee } from "../../types/employee";

interface EmployeeCardProps {
  employee: Employee;
  onDelete: (id: string) => void;
}

function EmployeeCard({
  employee,
  onDelete,
}: EmployeeCardProps) {
  const navigate = useNavigate();

  const fullName =
    employee.user?.fullName ||
    "N/A";

  const email =
    employee.user?.email ||
    "-";

  const role =
    employee.user?.role ||
    "EMPLOYEE";

  const phone =
    employee.phone ||
    "-";

  const department =
    employee.department ||
    "-";

  const designation =
    employee.designation ||
    "-";

  const employeeCode =
    employee.employeeCode ||
    "-";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-lg">
            {initials || "E"}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900">
              {fullName}
            </h3>

            <p className="truncate text-sm text-slate-500">
              {employeeCode}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {role}
        </span>
      </div>

      {/* Employee Details */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3">
          <Mail
            size={16}
            className="shrink-0 text-slate-400"
          />

          <span className="truncate text-sm text-slate-600">
            {email}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Phone
            size={16}
            className="shrink-0 text-slate-400"
          />

          <span className="text-sm text-slate-600">
            {phone}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Building2
            size={16}
            className="shrink-0 text-slate-400"
          />

          <span className="truncate text-sm text-slate-600">
            {department}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Briefcase
            size={16}
            className="shrink-0 text-slate-400"
          />

          <span className="truncate text-sm text-slate-600">
            {designation}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Shield
            size={16}
            className="shrink-0 text-slate-400"
          />

          <span className="text-sm font-medium text-slate-700">
            {role}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() =>
            navigate(`/employees/view/${employee.id}`)
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Eye size={15} />
          View
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/employees/edit/${employee.id}`)
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
        >
          <Pencil size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(employee.id)}
          className="flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
          title="Delete Employee"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default EmployeeCard;