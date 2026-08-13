import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ArrowLeft, Edit, Trash2, Printer } from "lucide-react";
import toast from "react-hot-toast";

import { invoiceService } from "../../services/invoice.service";
import type { Invoice, InvoiceStatus } from "../../types/invoice";

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const ViewInvoicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading, isError } = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: () => invoiceService.getInvoiceById(id!),
    enabled: !!id,
  });

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await invoiceService.deleteInvoice(id);
        toast.success("Invoice deleted successfully");
        navigate("/invoices");
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || "Failed to delete invoice";
        toast.error(message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading invoice...</div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Invoice not found</h2>
        <p className="mt-1 text-sm text-red-600">The invoice could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/invoices")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {invoice.invoiceNumber}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Invoice Details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Print"
          >
            <Printer className="h-5 w-5 text-slate-600" />
          </button>
          <a
            href={`/invoices/edit/${id}`}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Edit"
          >
            <Edit className="h-5 w-5 text-slate-600" />
          </a>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoice Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Invoice Number</p>
                <p className="text-sm font-medium text-slate-900">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status as InvoiceStatus] || "bg-gray-100 text-gray-800"}`}>
                  {invoice.status.replace("_", " ")}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Issue Date</p>
                <p className="text-sm font-medium text-slate-900">{new Date(invoice.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="text-sm font-medium text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoice Items</h2>
            {invoice.items && invoice.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-slate-900">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-slate-600 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-slate-600 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-900 text-right">${Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No items</p>
            )}
          </div>

          {invoice.payments && invoice.payments.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Method
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reference
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-2 text-sm text-slate-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{payment.method}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{payment.referenceNo || "-"}</td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-900 text-right">${Number(payment.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h2>
            {invoice.client ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Company</p>
                  <p className="text-sm font-medium text-slate-900">{invoice.client.companyName}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No client information</p>
            )}
          </div>

          {invoice.project && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Information</h2>
              <div>
                <p className="text-sm text-slate-500">Project</p>
                <p className="text-sm font-medium text-slate-900">{invoice.project.name}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm text-slate-500">Subtotal</p>
                <p className="text-sm font-medium text-slate-900">${Number(invoice.subtotal).toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-slate-500">Tax</p>
                <p className="text-sm font-medium text-slate-900">${Number(invoice.tax).toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-slate-500">Discount</p>
                <p className="text-sm font-medium text-slate-900">${Number(invoice.discount).toFixed(2)}</p>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Total</p>
                <p className="text-sm font-bold text-slate-900">${Number(invoice.total).toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-slate-500">Paid</p>
                <p className="text-sm font-medium text-green-600">${Number(invoice.paidAmount).toFixed(2)}</p>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Balance</p>
                <p className="text-sm font-bold text-slate-900">${Number(invoice.balanceAmount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
              <p className="text-sm text-slate-600">{invoice.notes}</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Metadata</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="text-sm text-slate-600">{new Date(invoice.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Updated</p>
                <p className="text-sm text-slate-600">{new Date(invoice.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoicePage;
