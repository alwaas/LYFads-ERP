import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import EmployeeTable from "../../components/employees/EmployeeTable";

import { getEmployees, deleteEmployee } from "../../services/employee.service";
import type { Employee } from "../../types/employee";

function EmployeesPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Function declared BEFORE useEffect
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data: any = await getEmployees();
      setEmployees(Array.isArray(data) ? data : data?.employees || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employees.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const refresh = async () => {
    try {
      setRefreshing(true);
      const data: any = await getEmployees();
      setEmployees(Array.isArray(data) ? data : data?.employees || []);
      toast.success("Employees refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      await deleteEmployee(id);
      setEmployees((prev) => (Array.isArray(prev) ? prev.filter((x) => x.id !== id) : []));
      toast.success("Employee deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
    }
  };

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filteredEmployees = safeEmployees.filter((emp: any) => {
    const keyword = search.toLowerCase();
    const fullName = emp.fullName || emp.user?.fullName || "";
    const email = emp.email || emp.user?.email || "";
    const employeeCode = emp.employeeCode || "";
    const department = emp.department || "";
    
    return (
      fullName.toLowerCase().includes(keyword) ||
      email.toLowerCase().includes(keyword) ||
      employeeCode.toLowerCase().includes(keyword) ||
      department.toLowerCase().includes(keyword)
    );
  });

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">

          {/* Header Section with Refresh & Add Button */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Employees Management
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Manage organization staff, roles, and profiles.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={refresh}
                  disabled={refreshing}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition font-medium text-sm shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => navigate("/employees/add")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Employee</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, employee code or department..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
            />
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
              <p className="text-slate-500 text-base animate-pulse font-medium">Loading Employees...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-2xs space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Employees Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {search ? "No employees match your search criteria." : "Start by adding your first employee."}
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/employees/add")}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={16} /> Add Employee
                </button>
              )}
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <EmployeeTable employees={filteredEmployees} onDelete={handleDelete} />
              </div>
            </div>
          )}

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default EmployeesPage;