import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";

import LeaveTable from "../../components/leaves/LeaveTable";
import LeaveStats from "../../components/leaves/LeaveStats";
import Pagination from "../../components/ui/Pagination";

import {
  getLeaves,
  deleteLeave,
  approveLeave,
  rejectLeave,
} from "../../services/leave.service";

import type { Leave } from "../../types/leave";

function LeavesPage() {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const result: any = await getLeaves(page, limit, search, statusFilter, typeFilter);
      setLeaves(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leaves.");
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [page, limit, search, statusFilter, typeFilter]);

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

  const handleApprove = async (id: string) => {
    try {
      await approveLeave(id);
      toast.success("Leave approved successfully.");
      loadLeaves();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "Failed to approve leave.");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await rejectLeave(id, reason);
      toast.success("Leave rejected.");
      loadLeaves();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "Failed to reject leave.");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
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
            handleSearch(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-3"
        />

        <div className="grid md:grid-cols-2 gap-4">

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
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

        {leaves.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No leaves found.</p>
          </div>
        ) : (
          <LeaveTable
            leaves={leaves}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onReject={handleReject}
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

export default LeavesPage;
