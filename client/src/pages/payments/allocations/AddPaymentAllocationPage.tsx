import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { paymentService } from "../../../services/payment.service";
import { invoiceService } from "../../../services/invoice.service";
import { mapServerValidationErrors } from "../../../features/validation/errors";
import { createPaymentAllocationSchema, type CreatePaymentAllocationFormData } from "../../../features/validation/payment-allocation.schema";
import type { Payment } from "../../../types/payment";
import type { Invoice } from "../../../types/invoice";

const AddPaymentAllocationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: () => paymentService.getAllPayments(1, 100, undefined, undefined),
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoices(1, 1000, undefined, undefined),
  });

  const activePayments = payments.filter((p) => p.status === "ACTIVE");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<CreatePaymentAllocationFormData>({
    resolver: zodResolver(createPaymentAllocationSchema) as any,
    defaultValues: {
      paymentId: "",
      invoiceId: "",
      amount: "",
    },
  });

  const selectedPaymentId = watch("paymentId");
  const selectedInvoiceId = watch("invoiceId");

  const selectedPayment = activePayments.find((p) => p.id === selectedPaymentId);
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const createMutation = useMutation({
    mutationFn: (dto: CreatePaymentAllocationFormData) =>
      paymentService.createPaymentAllocation({
        paymentId: dto.paymentId,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment allocation created successfully");
      navigate("/payments/allocations");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CreatePaymentAllocationFormData, { message });
        });
      } else {
        const message = (error as any)?.response?.data?.message || (error as any)?.message || "Failed to create payment allocation";
        toast.error(message);
      }
    },
  });

  const onSubmit = (data: CreatePaymentAllocationFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/payments/allocations")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Add Payment Allocation
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Allocate a payment to an invoice
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="paymentId" className="block text-sm font-medium text-slate-700 mb-2">
                Payment *
              </label>
              <select
                id="paymentId"
                {...register("paymentId")}
                disabled={isLoadingPayments}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a payment</option>
                {activePayments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {payment.referenceNo || `Payment ${payment.id.slice(-6)}`} - ${Number(payment.amount).toFixed(2)} ({payment.method})
                  </option>
                ))}
              </select>
              {errors.paymentId && (
                <p className="mt-1 text-xs text-red-600">{errors.paymentId.message}</p>
              )}
              {selectedPayment && (
                <p className="mt-1 text-xs text-slate-500">
                  Invoice: {selectedPayment.invoice?.invoiceNumber || "N/A"} | Client: {selectedPayment.invoice?.client?.companyName || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="invoiceId" className="block text-sm font-medium text-slate-700 mb-2">
                Invoice *
              </label>
              <select
                id="invoiceId"
                {...register("invoiceId")}
                disabled={isLoadingInvoices}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select an invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - ${Number(invoice.total).toFixed(2)} (Balance: ${Number(invoice.balanceAmount).toFixed(2)})
                  </option>
                ))}
              </select>
              {errors.invoiceId && (
                <p className="mt-1 text-xs text-red-600">{errors.invoiceId.message}</p>
              )}
              {selectedInvoice && (
                <p className="mt-1 text-xs text-slate-500">
                  Client: {selectedInvoice.client?.companyName || "N/A"} | Status: {selectedInvoice.status}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                Allocation Amount *
              </label>
              <input
                type="number"
                id="amount"
                {...register("amount")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/payments/allocations")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Allocating..." : "Create Allocation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentAllocationPage;
