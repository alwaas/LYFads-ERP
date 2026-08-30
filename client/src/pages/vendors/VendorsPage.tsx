import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Search, RefreshCw } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { vendorService } from "../../services/vendor.service";
import type { Vendor } from "../../types/vendor";

function VendorsPage() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorService.getAllVendors();
      setVendors(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      const data = await vendorService.getAllVendors();
      setVendors(data);
      toast.success("Vendors refreshed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;

    try {
      await vendorService.deleteVendor(id);
      setVendors((prev) => prev.filter((x) => x.id !== id));
      toast.success("Vendor deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const keyword = search.toLowerCase();
    return (
      vendor.name.toLowerCase().includes(keyword) ||
      vendor.vendorCode.toLowerCase().includes(keyword) ||
      (vendor.contactPerson ?? "").toLowerCase().includes(keyword) ||
      (vendor.email ?? "").toLowerCase().includes(keyword)
    );
  });

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">

          {/* Header Section */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Vendors Management
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Manage and monitor all your business vendors efficiently.
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
                  onClick={() => navigate("/vendors/add")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Vendor</span>
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
              placeholder="Search by name, code, contact or email..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-2xs transition"
            />
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
              <p className="text-slate-500 text-base animate-pulse font-medium">Loading Vendors...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-2xs space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Vendors Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {search ? "No vendors match your search criteria." : "Start by adding your first vendor."}
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/vendors/add")}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Plus size={16} /> Add Vendor
                </button>
              )}
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Name</th>
                      <th className="px-6 py-4 text-left">Code</th>
                      <th className="px-6 py-4 text-left">Contact Person</th>
                      <th className="px-6 py-4 text-left">Email</th>
                      <th className="px-6 py-4 text-left">Phone</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-500">
                          No Vendors Found
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((vendor) => (
                        <tr key={vendor.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-semibold">{vendor.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            {vendor.vendorCode}
                          </td>
                          <td className="px-6 py-4">
                            {vendor.contactPerson || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {vendor.email || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {vendor.phone || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                vendor.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <a
                                href={`/vendors/view/${vendor.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                              <a
                                href={`/vendors/edit/${vendor.id}`}
                                className="text-green-600 hover:underline"
                              >
                                Edit
                              </a>
                              <button
                                onClick={() => handleDelete(vendor.id)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
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

export default VendorsPage;
