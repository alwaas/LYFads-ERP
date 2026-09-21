import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import { expenseService } from "../../services/expense.service";
import type { Expense } from "../../types/expense";

const categoryColors: Record<string, string> = {
  SALARY: "bg-blue-100 text-blue-800",
  RENT: "bg-purple-100 text-purple-800",
  UTILITIES: "bg-yellow-100 text-yellow-800",
  SUPPLIES: "bg-green-100 text-green-800",
  MARKETING: "bg-pink-100 text-pink-800",
  TRAVEL: "bg-indigo-100 text-indigo-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  PAID: "bg-blue-100 text-blue-800",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  UPI: "UPI",
  CARD: "Card",
  CHEQUE: "Cheque",
};

const ViewExpensePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: expense, isLoading, isError } = useQuery<Expense>({
    queryKey: ["expenses", id],
    queryFn: () => expenseService.getExpenseById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !expense) {
    toast.error("Expense not found");
    navigate("/expenses");
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
            <Wallet className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Expense Details
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            View expense record information
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{expense.description}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Created on {new Date(expense.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[expense.status]}`}>
                {expense.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${Number(expense.amount).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </p>
              <p className="mt-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[expense.category]}`}>
                  {expense.category.replace("_", " ")}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment Method
              </p>
              <p className="mt-2 text-sm text-slate-900">
                {paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vendor / Payee
              </p>
              <p className="mt-2 text-sm text-slate-900">{expense.vendor}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expense Date
              </p>
              <p className="mt-2 text-sm text-slate-900">
                {new Date(expense.expenseDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created By
              </p>
              <p className="mt-2 text-sm text-slate-900">
                {expense.user?.fullName || "-"}
              </p>
            </div>

            {expense.receiptUrl && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Receipt
                </p>
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  View Receipt
                </a>
              </div>
            )}

            {expense.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{expense.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <a
            href={`/expenses/edit/${expense.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Edit
          </a>
        </div>
      </div>
    </div>
  );
};

export default ViewExpensePage;
