import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import { vendorService } from "../../services/vendor.service";
import type { Vendor } from "../../types/vendor";

const ViewVendorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendor = async () => {
      if (!id) return;
      try {
        const data = await vendorService.getVendorById(id);
        setVendor(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load vendor");
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!vendor) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="text-center text-slate-500">Vendor not found.</div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/vendors")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{vendor.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Vendor details and information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Contact Person</p>
              <p className="text-sm font-medium text-slate-900">{vendor.contactPerson || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-900">{vendor.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-900">{vendor.phone || "-"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Address</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="text-sm font-medium text-slate-900">{vendor.address || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">City</p>
                <p className="text-sm font-medium text-slate-900">{vendor.city || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">State</p>
                <p className="text-sm font-medium text-slate-900">{vendor.state || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Country</p>
                <p className="text-sm font-medium text-slate-900">{vendor.country || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Pincode</p>
                <p className="text-sm font-medium text-slate-900">{vendor.pincode || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">GST Number</p>
              <p className="text-sm font-medium text-slate-900">{vendor.gstNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  vendor.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {vendor.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Notes</p>
              <p className="text-sm font-medium text-slate-900">{vendor.notes || "-"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">System Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Vendor ID</p>
              <p className="text-sm font-medium text-slate-900 font-mono">{vendor.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created At</p>
              <p className="text-sm font-medium text-slate-900">{new Date(vendor.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Updated At</p>
              <p className="text-sm font-medium text-slate-900">{new Date(vendor.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewVendorPage;
