import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, User, Mail, Phone, Briefcase, Building, Shield, Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { getEmployee, deleteEmployee } from "../../services/employee.service";

function ViewEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadEmployee(id);
  }, [id]);

  const loadEmployee = async (empId: string) => {
    try {
      const data = await getEmployee(empId);
      setEmployee(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      await deleteEmployee(id);
      toast.success("Employee deleted successfully.");
      navigate("/employees");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete employee.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base animate-pulse font-medium">Loading employee details...</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-lg font-medium">Employee not found.</p>
            <Link
              to="/employees"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-medium text-sm"
            >
              <ArrowLeft size={18} /> Back to Employees
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  const fullName = employee.user?.fullName || employee.fullName || "N/A";
  const email = employee.user?.email || employee.email || "-";
  const phone = employee.phone || "-";
  const department = employee.department || "-";
  const designation = employee.designation || "-";
  const role = employee.user?.role || employee.role || "EMPLOYEE";
  const employeeCode = employee.employeeCode || "-";

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/employees"
                className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Employee Profile Details
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/employees/edit/${employee.id}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Pencil size={16} /> Edit
              </Link>

              <button
                onClick={handleDelete}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition font-medium text-sm shadow-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <User size={28} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Employee Name</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                    {fullName}
                  </h2>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-full border border-slate-200">
                Code: {employeeCode}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><Mail size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email Address</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5 break-all">{email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-2xs mt-0.5"><Phone size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-purple-600 rounded-lg shadow-2xs mt-0.5"><Briefcase size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Designation</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{designation}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-green-600 rounded-lg shadow-2xs mt-0.5"><Building size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Department</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{department}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="p-2.5 bg-white text-amber-600 rounded-lg shadow-2xs mt-0.5"><Shield size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">System Role</p>
                  <p className="text-slate-900 font-semibold text-base mt-0.5">{role}</p>
                </div>
              </div>
              {/* Employee Code */}
              
              
            </div>
          </div>

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default ViewEmployeePage;