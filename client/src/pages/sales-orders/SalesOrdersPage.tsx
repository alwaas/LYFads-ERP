import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PackagePlus, Plus, Search, RefreshCw, Edit, Trash2, Eye, CheckCircle2, Loader, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import Pagination from "../../components/ui/Pagination";
import { salesOrderService } from "../../services/sales-order.service";
import type { SalesOrderStatus } from "../../types/sales-order";

type PagedResponse = {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const statusColors: Record<SalesOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  FULFILLED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const SalesOrdersPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: result, isLoading, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ["sales-orders", page, limit, searchQuery, statusFilter],
    queryFn: () => salesOrderService.getAllSalesOrders(page, limit, searchQuery, statusFilter),
  });

  const salesOrders = result?.data || [];
  const totalPages = result?.totalPages || 1;

  const confirmMutation = useMutation({
    mutationFn: (id: string) => salesOrderService.confirmSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Sales order confirmed");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to confirm sales order";
      toast.error(message);
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => salesOrderService.processSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Sales order processing started");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to process sales order";
      toast.error(message);
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => salesOrderService.fulfillSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Sales order fulfilled");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to fulfill sales order";
      toast.error(message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesOrderService.cancelSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Sales order cancelled");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to cancel sales order";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesOrderService.deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Sales order deleted successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to delete sales order";
      toast.error(message);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this sales order?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load sales orders</h2>
        <p className="mt-1 text-sm text-red-600">The sales orders service could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sales Orders
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage all sales orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <a
            href="/sales-orders/add"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Sales Order
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search sales orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Order Date</th>
                <th className="px-4 py-3 font-medium">Delivery Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No sales orders found
                  </td>
                </tr>
              ) : (
                salesOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{order.client?.companyName || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status as SalesOrderStatus] || "bg-gray-100 text-gray-800"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={`/sales-orders/${order.id}`}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {order.status === "DRAFT" && (
                          <button
                            onClick={() => confirmMutation.mutate(order.id)}
                            disabled={confirmMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                            title="Confirm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === "CONFIRMED" && (
                          <button
                            onClick={() => processMutation.mutate(order.id)}
                            disabled={processMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 disabled:opacity-50"
                            title="Process"
                          >
                            <Loader className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === "PROCESSING" && (
                          <button
                            onClick={() => fulfillMutation.mutate(order.id)}
                            disabled={fulfillMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-50"
                            title="Fulfill"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {(order.status === "DRAFT" || order.status === "CONFIRMED" || order.status === "PROCESSING") && (
                          <button
                            onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                            title="Cancel"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <a
                          href={`/sales-orders/${order.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
        </div>
      </div>
    </div>
  );
};

export default SalesOrdersPage;
