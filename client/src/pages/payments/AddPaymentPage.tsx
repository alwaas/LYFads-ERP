import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CreditCard, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { paymentService } from "../../services/payment.service";
import { invoiceService } from "../../services/invoice.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { createPaymentSchema, type CreatePaymentFormData } from "../../features/validation/payment.schema";
import type { CreatePaymentDto } from "../../types/payment";
import type { Invoice } from "../../types/invoice";

const AddPaymentPage = () => {
  const navigate = useNavigate();

  const { data: rawInvoices, isLoading: isLoadingInvoices, isError: isInvoicesError } = useQuery<any>({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoices(1, 100),
  });

  const invoices: Invoice[] = Array.isArray(rawInvoices)
    ? rawInvoices
    : (rawInvoices?.data || []);

  const createMutation = useMutation({
    mutationFn: (dto: CreatePaymentDto) => paymentService.createPayment(dto),
    onSuccess: () => {
      toast.success("Payment created successfully");
      navigate("/payments");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message = axiosError.response?.data?.message || "Failed to create payment";
        toast.error(message);
      } else {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        const message = axiosError.response?.data?.message || axiosError.message || "Failed to create payment";
        toast.error(message);
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema) as any,
    defaultValues: {
      invoiceId: "",
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      method: "BANK_TRANSFER",
      referenceNo: "",
      remarks: "",
    },
  });

  const onSubmit = async (data: CreatePaymentFormData) => {
    const payload: CreatePaymentDto = {
      ...data,
      amount: String(data.amount),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
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
              Add Payment
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create a new payment record
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="invoiceId" className="block text-sm font-medium text-slate-700 mb-2">
                Invoice *
              </label>
              <select
                id="invoiceId"
                {...register("invoiceId")}
                disabled={isLoadingInvoices}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select an invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.client?.companyName || "Unknown Client"} - Total: ${Number(invoice.total).toFixed(2)} - Balance: ${Number(invoice.balanceAmount).toFixed(2)}
                  </option>
                ))}
              </select>
              {isInvoicesError && (
                <p className="mt-1 text-xs text-red-600">Failed to load invoices. Please refresh the page.</p>
              )}
              {invoices.length === 0 && !isLoadingInvoices && !isInvoicesError && (
                <p className="mt-1 text-xs text-amber-600">No invoices available. Please create an invoice first.</p>
              )}
              {errors.invoiceId && (
                <p className="mt-1 text-xs text-red-600">{errors.invoiceId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                id="paymentDate"
                {...register("paymentDate")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.paymentDate && (
                <p className="mt-1 text-xs text-red-600">{errors.paymentDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method *
              </label>
              <select
                id="method"
                {...register("method")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
              {errors.method && (
                <p className="mt-1 text-xs text-red-600">{errors.method.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="referenceNo" className="block text-sm font-medium text-slate-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                id="referenceNo"
                {...register("referenceNo")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter reference number"
              />
              {errors.referenceNo && (
                <p className="mt-1 text-xs text-red-600">{errors.referenceNo.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 mb-2">
              Remarks
            </label>
            <textarea
              id="remarks"
              {...register("remarks")}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter any additional notes"
            />
            {errors.remarks && (
              <p className="mt-1 text-xs text-red-600">{errors.remarks.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/payments")}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || isLoadingInvoices}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? "Creating..." : "Create Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentPage;
