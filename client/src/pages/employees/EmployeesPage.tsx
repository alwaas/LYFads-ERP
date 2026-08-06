import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmployeeTable from "../../components/employees/EmployeeTable";
import EmployeeFilters from "../../components/employees/EmployeeFilters";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import { usePermission } from "../../hooks/usePermission";

import {
    getEmployees,
    deleteEmployee,
  } from "../../services/employee.service";

import type { Employee } from "../../types/employee";

function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const { hasPermission } = usePermission();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Employee?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteEmployee(id);

      toast.success("Employee deleted successfully.");

      loadEmployees();
    } catch (error) {
      console.error(error);

      toast.error("Failed to delete employee.");
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.user.fullName
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        employee.user.email
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        employee.employeeCode
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesDepartment =
        !department ||
        employee.department === department;

      const matchesRole =
        !role ||
        employee.user.role === role;

      const matchesStatus =
        !status ||
        (status === "ACTIVE"
          ? employee.user.isActive
          : !employee.user.isActive);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    employees,
    search,
    department,
    role,
    status,
  ]);

  const resetFilters = () => {
    setSearch("");
    setDepartment("");
    setRole("");
    setStatus("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <h1 className="text-3xl font-bold">
            Employees
          </h1>

          {hasPermission("employees", "create") && (
            <Link
              to="/employees/add"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              + Add Employee
            </Link>
          )}

        </div>

        <EmployeeFilters
          search={search}
          setSearch={setSearch}
          department={department}
          setDepartment={setDepartment}
          role={role}
          setRole={setRole}
          status={status}
          setStatus={setStatus}
          resetFilters={resetFilters}
        />

        {loading ? (
          <div>Loading Employees...</div>
        ) : (
          <EmployeeTable employees={filteredEmployees} onDelete={handleDelete}/>
        )}

      </div>
    </DashboardLayout>
  );
}

export default EmployeesPage;