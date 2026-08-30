import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { vendorService } from "../../services/vendor.service";
import type { Vendor } from "../../types/vendor";

const ViewVendorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vendor, isLoading, isError } = useQuery<Vendor>({
    queryKey: ["vendors", id],
    queryFn: () => vendorService.getVendorById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !vendor) {
    toast.error("Vendor not found");
    navigate("/vendors");
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/vendors")}
          className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-slate-600 shadow-2xs shrink-0"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vendor Details
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            View vendor record information
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{vendor.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Code: {vendor.vendorCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  vendor.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {vendor.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact Person
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.contactPerson || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.email || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.phone || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alternate Phone
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.alternatePhone || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tax / GST Number
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.taxNumber || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment Terms
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.paymentTerms || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                City
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.city || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                State
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.state || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Country
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.country || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Postal Code
              </p>
              <p className="mt-2 text-sm text-slate-900">{vendor.postalCode || "-"}</p>
            </div>

            {vendor.address && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Address
                </p>
                <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{vendor.address}</p>
              </div>
            )}

            {vendor.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{vendor.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <a
            href={`/vendors/edit/${vendor.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Edit
          </a>
        </div>
      </div>
    </div>
  );
};

export default ViewVendorPage;
