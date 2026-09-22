import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, ArrowLeft } from "lucide-react";
import { z } from "zod";
import toast from "react-hot-toast";

import { paymentService } from "../../services/payment.service";
import { vendorBillService } from "../../services/vendor-bill.service";
import type { PaymentMethod } from "../../types/payment";
import type { VendorBill } from "../../types/vendor-bill";

const paymentMethodEnum = ["CASH", "BANK_TRANSFER", "UPI", "CARD", "CHEQUE"] as const;

const applyPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .finite("Amount must be a valid number")
    .positive("Amount must be greater than zero"),
  paymentDate: z.string().min(1, "Payment date is required"),
  method: z.enum(paymentMethodEnum, { message: "Please select a valid payment method" }),
  referenceNo: z.string().max(100).trim().optional().default(""),
  remarks: z.string().max(500).trim().optional().default(""),
});

type ApplyPaymentFormData = z.infer<typeof applyPaymentSchema>;

const ApplyVendorBillPaymentPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const { data: bill, isLoading } = useQuery<VendorBill>({
    queryKey: ["vendor-bill", id],
    queryFn: () => vendorBillService.getVendorBillById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyPaymentFormData>({
    resolver: zodResolver(applyPaymentSchema) as any,
    defaultValues: {
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      method: "BANK_TRANSFER" as PaymentMethod,
      referenceNo: "",
      remarks: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => paymentService.createPayment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bill", id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment recorded successfully");
      navigate(`/vendor-bills/${id}`);
    },
    onError: (error: unknown) => {
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Failed to record payment";
      toast.error(message);
    },
  });

  const onSubmit = (data: ApplyPaymentFormData) => {
    const payload = {
      purchaseInvoiceId: id,
      amount: String(data.amount),
      paymentDate: data.paymentDate,
      method: data.method,
      referenceNo: data.referenceNo,
      remarks: data.remarks,
    };
    createMutation.mutate(payload);
  };

  if (isLoading) {
    return <div className="text-slate-500 text-center py-8">Loading vendor bill...</div>;
  }

  if (!bill) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Vendor bill not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/vendor-bills/${id}`)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Record Payment</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Paying bill {bill.invoiceNumber} — balance ${Number(bill.balanceAmount).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              onClick={() => navigate(`/vendor-bills/${id}`)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyVendorBillPaymentPage;
