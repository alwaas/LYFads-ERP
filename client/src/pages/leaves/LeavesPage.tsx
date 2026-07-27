import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import LeaveTable from "../../components/leaves/LeaveTable";
import LeaveStats from "../../components/leaves/LeaveStats";

import {
  getLeaves,
  deleteLeave,
} from "../../services/leave.service";

import type { Leave } from "../../types/leave";

function LeavesPage() {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const data = await getLeaves();
      setLeaves(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leaves.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this leave request?")) {
      return;
    }

    try {
      await deleteLeave(id);

      toast.success("Leave deleted successfully.");

      loadLeaves();
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ??
          "Failed to delete leave."
      );
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesSearch =
        leave.employee.user.fullName
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        leave.employee.employeeCode
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "" ||
        leave.status === statusFilter;

      const matchesType =
        typeFilter === "" ||
        leave.leaveType === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    leaves,
    search,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    typeFilter,
  ]);

  const totalPages = Math.ceil(
    filteredLeaves.length / rowsPerPage
  );

  const paginatedLeaves =
    filteredLeaves.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Leave Management
          </h1>

          <button
            onClick={() =>
              navigate("/leaves/add")
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            + Apply Leave
          </button>

        </div>

        <LeaveStats leaves={leaves} />

        <input
          type="text"
          placeholder="Search Employee..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-3"
        />

        <div className="grid md:grid-cols-2 gap-4">

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3"
          >
            <option value="">
              All Status
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
            </option>

          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3"
          >
            <option value="">
              All Leave Types
            </option>

            <option value="CASUAL">
              Casual
            </option>

            <option value="SICK">
              Sick
            </option>

            <option value="EARNED">
              Earned
            </option>

            <option value="UNPAID">
              Unpaid
            </option>

            <option value="MATERNITY">
              Maternity
            </option>

            <option value="PATERNITY">
              Paternity
            </option>

          </select>

        </div>

        {loading ? (

          <div className="flex justify-center py-16">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

          </div>

        ) : (

          <LeaveTable
            leaves={paginatedLeaves}
            onDelete={handleDelete}
          />

        )}

        {totalPages > 1 && (

          <div className="flex justify-center gap-3">

            <button
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) => page - 1
                )
              }
              className="border rounded-lg px-4 py-2 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="font-medium">

              Page {currentPage} of {totalPages}

            </span>

            <button
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) => page + 1
                )
              }
              className="border rounded-lg px-4 py-2 disabled:opacity-50"
            >
              Next
            </button>

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}

export default LeavesPage;