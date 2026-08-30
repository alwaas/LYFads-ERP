import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { salesOrderService } from "../../services/sales-order.service";
import type { SalesOrder, SalesOrderStatus } from "../../types/sales-order";

const statuses: { value: SalesOrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PARTIALLY_FULFILLED", label: "Partially Fulfilled" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
];

function SalesOrdersPage() {
  const navigate = useNavigate();

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | "ALL">("ALL");

  useEffect(() => {
    loadSalesOrders();
  }, []);

  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      const data = await salesOrderService.getAllSalesOrders();
      setSalesOrders(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load sales orders.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      const data = await salesOrderService.getAllSalesOrders();
      setSalesOrders(data);
      toast.success("Sales orders refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this sales order?")) return;

    try {
      await salesOrderService.deleteSalesOrder(id);
      setSalesOrders((prev) => prev.filter((x) => x.id !== id));
      toast.success("Sales order deleted successfully.");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Delete failed.");
    }
  };

  const filteredSalesOrders = salesOrders.filter((so) => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      so.orderNumber.toLowerCase().includes(keyword) ||
      so.client.companyName.toLowerCase().includes(keyword) ||
      (so.notes ?? "").toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "ALL" || so.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const statusColors: Record<SalesOrderStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    PARTIALLY_FULFILLED: "bg-orange-100 text-orange-700",
    FULFILLED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">

          {/* Header Section */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Sales Orders
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Manage sales orders and fulfillment.
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
                  onClick={() => navigate("/sales-orders/add")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Sales Order</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number, client or notes..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SalesOrderStatus | "ALL")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
              <p className="text-slate-500 text-base animate-pulse font-medium">Loading Sales Orders...</p>
            </div>
          ) : filteredSalesOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-2xs space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Sales Orders Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {search || statusFilter !== "ALL"
                  ? "No sales orders match your search criteria."
                  : "Start by adding your first sales order."}
              </p>
              {!search && statusFilter === "ALL" && (
                <button
                  onClick={() => navigate("/sales-orders/add")}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={16} /> Add Sales Order
                </button>
              )}
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Order Number</th>
                      <th className="px-6 py-4 text-left">Client</th>
                      <th className="px-6 py-4 text-left">Order Date</th>
                      <th className="px-6 py-4 text-left">Expected Delivery</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-500">
                          No Sales Orders Found
                        </td>
                      </tr>
                    ) : (
                      filteredSalesOrders.map((so) => (
                        <tr key={so.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-semibold">{so.orderNumber}</p>
                          </td>
                          <td className="px-6 py-4">
                            {so.client.companyName}
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(so.orderDate)}
                          </td>
                          <td className="px-6 py-4">
                            {so.expectedDeliveryDate ? formatDate(so.expectedDeliveryDate) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[so.status]}`}>
                              {so.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {formatCurrency(so.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <a
                                href={`/sales-orders/${so.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                              {so.status === "DRAFT" && (
                                <>
                                  <a
                                    href={`/sales-orders/edit/${so.id}`}
                                    className="text-green-600 hover:underline"
                                  >
                                    Edit
                                  </a>
                                  <button
                                    onClick={() => handleDelete(so.id)}
                                    className="text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default SalesOrdersPage;
