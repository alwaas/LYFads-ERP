import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, ArrowLeft, Edit, Calendar, DollarSign, FileText, Building2 } from "lucide-react";

import { paymentService } from "../../services/payment.service";
import type { Payment, PaymentMethod } from "../../types/payment";

const methodColors: Record<PaymentMethod, string> = {
  CASH: "bg-green-100 text-green-800",
  BANK_TRANSFER: "bg-blue-100 text-blue-800",
  UPI: "bg-purple-100 text-purple-800",
  CARD: "bg-orange-100 text-orange-800",
  CHEQUE: "bg-gray-100 text-gray-800",
};

const ViewPaymentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: payment, isLoading, isError } = useQuery<Payment>({
    queryKey: ["payment", id],
    queryFn: () => paymentService.getPaymentById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (isError || !payment) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load payment</h2>
        <p className="mt-1 text-sm text-red-600">The payment could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/payments")}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Payment Details
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              View payment information
            </p>
          </div>
        </div>

        <a
          href={`/payments/edit/${payment.id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Edit className="h-4 w-4" />
          Edit Payment
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Invoice Number</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {payment.invoice?.invoiceNumber || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Amount</p>
                  <p className="text-sm font-semibold text-slate-900">
                    ${Number(payment.amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                  <Calendar className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Payment Date</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Payment Method</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${methodColors[payment.method]}`}>
                    {payment.method.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500">Reference Number</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {payment.referenceNo || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {payment.remarks && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Remarks</h2>
              <p className="text-sm text-slate-600">{payment.remarks}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoice Details</h2>
            {payment.invoice ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Client</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {payment.invoice.client?.companyName || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Invoice Number</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {payment.invoice.invoiceNumber}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No invoice information available</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Timestamps</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Created At</p>
                <p className="text-sm text-slate-900">
                  {new Date(payment.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Updated At</p>
                <p className="text-sm text-slate-900">
                  {new Date(payment.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPaymentPage;