import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { paymentService } from "../../services/payment.service";
import type { UpdatePaymentDto } from "../../types/payment";

const EditPaymentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<UpdatePaymentDto>({
    amount: "0",
    paymentDate: "",
    method: "BANK_TRANSFER",
    referenceNo: "",
    remarks: "",
  });

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => paymentService.getPaymentById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: String(payment.amount),
        paymentDate: payment.paymentDate.split("T")[0],
        method: payment.method,
        referenceNo: payment.referenceNo || "",
        remarks: payment.remarks || "",
      });
    }
  }, [payment]);

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePaymentDto }) =>
      paymentService.updatePayment(id, dto),
    onSuccess: () => {
      toast.success("Payment updated successfully");
      navigate("/payments");
    },
    onError: () => {
      toast.error("Failed to update payment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      updateMutation.mutate({ id, dto: formData });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

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
              Edit Payment
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Update payment information
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method *
              </label>
              <select
                id="method"
                name="method"
                value={formData.method}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label htmlFor="referenceNo" className="block text-sm font-medium text-slate-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                id="referenceNo"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter reference number"
              />
            </div>
          </div>

          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 mb-2">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter any additional notes"
            />
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
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? "Updating..." : "Update Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPaymentPage;