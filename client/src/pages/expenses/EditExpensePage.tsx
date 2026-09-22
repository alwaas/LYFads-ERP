import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Wallet, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { expenseService } from "../../services/expense.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { editExpenseSchema, type EditExpenseFormData } from "../../features/validation/expense.schema";
import type { UpdateExpenseDto } from "../../types/expense";

const EditExpensePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditExpenseFormData>({
    resolver: zodResolver(editExpenseSchema) as any,
    defaultValues: {
      expenseDate: "",
      category: "",
      description: "",
      amount: 0,
      paymentMethod: "CASH",
      referenceNo: "",
      notes: "",
    },
  });

  useEffect(() => {
    const loadExpense = async () => {
      if (!id) return;
      try {
        const expense = await expenseService.getExpenseById(id);
        reset({
          expenseDate: expense.expenseDate.split("T")[0],
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          referenceNo: expense.referenceNo || "",
          notes: expense.notes || "",
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load expense");
        navigate("/expenses");
      }
    };

    loadExpense();
  }, [id, navigate, reset]);

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateExpenseDto) => expenseService.updateExpense(id!, dto),
    onSuccess: () => {
      toast.success("Expense updated successfully");
      navigate("/expenses");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message = axiosError.response?.data?.message || "Failed to update expense";
        toast.error(message);
      } else {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        const message = axiosError.response?.data?.message || axiosError.message || "Failed to update expense";
        toast.error(message);
      }
    },
  });

  const onSubmit = async (data: EditExpenseFormData) => {
    const payload: UpdateExpenseDto = {
      ...data,
      amount: data.amount !== undefined ? String(data.amount) : undefined,
    };
    updateMutation.mutate(payload);
  };

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/expenses")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Edit Expense
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Update expense record
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="expenseDate" className="block text-sm font-medium text-slate-700 mb-2">
                Expense Date *
              </label>
              <input
                type="date"
                id="expenseDate"
                {...register("expenseDate")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.expenseDate && (
                <p className="mt-1 text-xs text-red-600">{errors.expenseDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                id="category"
                {...register("category")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Office Supplies, Travel, Utilities"
              />
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter expense description"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
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
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                {...register("paymentMethod")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
              {errors.paymentMethod && (
                <p className="mt-1 text-xs text-red-600">{errors.paymentMethod.message}</p>
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
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter any additional notes"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/expenses")}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? "Updating..." : "Update Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpensePage;
