import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import Pagination from "../../components/ui/Pagination";
import { purchaseService, getActiveVendors } from "../../services/purchase.service";
import type { PaymentMethod } from "../../types/purchase";
import type { Vendor } from "../../types/vendor";

type PagedResponse = {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const methodColors: Record<PaymentMethod, string> = {
  CASH: "bg-green-100 text-green-800",
  BANK_TRANSFER: "bg-blue-100 text-blue-800",
  UPI: "bg-purple-100 text-purple-800",
  CARD: "bg-orange-100 text-orange-800",
  CHEQUE: "bg-gray-100 text-gray-800",
};

const PurchasesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeVendors, setActiveVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const vendors = await getActiveVendors();
        setActiveVendors(vendors);
      } catch (error) {
        console.error("Failed to load vendors", error);
      }
    };
    loadVendors();
  }, []);

  const { data: result, isLoading, isError } = useQuery<PagedResponse>({
    queryKey: ["purchases", page, limit, searchQuery, methodFilter, vendorFilter],
    queryFn: () =>
      purchaseService.getAllPurchases({
        search: searchQuery || undefined,
        method: methodFilter !== "all" ? (methodFilter as PaymentMethod) : undefined,
        vendorId: vendorFilter !== "all" ? vendorFilter : undefined,
      }),
  });

  const purchases = result?.data || [];
  const totalPages = result?.totalPages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchaseService.deletePurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete purchase");
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this purchase?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load purchases</h2>
        <p className="mt-1 text-sm text-red-600">The purchases service could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Purchases</h1>
          <p className="text-slate-500 mt-1">Track and manage your purchase orders.</p>
        </div>
        <button
          onClick={() => navigate("/purchases/add")}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="CHEQUE">Cheque</option>
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Vendors</option>
            {activeVendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Method</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Total</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No purchases found.
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {purchase.vendor?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {purchase.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${methodColors[purchase.paymentMethod as PaymentMethod] || "bg-gray-100 text-gray-800"}`}
                      >
                        {purchase.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ${Number(purchase.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/purchases/${purchase.id}`)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200">
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
      </div>
    </div>
  );
};

export default PurchasesPage;
