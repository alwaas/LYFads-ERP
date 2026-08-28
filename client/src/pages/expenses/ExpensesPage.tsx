import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";

import PageLoader from "../../components/common/PageLoader";
import Pagination from "../../components/ui/Pagination";
import { expenseService } from "../../services/expense.service";
import type { PaymentMethod } from "../../types/expense";

type PagedResponse = {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const methodColors: Record<PaymentMethod, string> = {
  CASH: "bg-green-100 text-green-800",
  BANK_TRANSFER: "bg-blue-100 text-blue-800",
  UPI: "bg-purple-100 text-purple-800",
  CARD: "bg-orange-100 text-orange-800",
  CHEQUE: "bg-gray-100 text-gray-800",
};

const ExpensesPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: result, isLoading, isError } = useQuery<PagedResponse>({
    queryKey: ["expenses", page, limit, searchQuery, methodFilter, categoryFilter],
    queryFn: () =>
      expenseService.getAllExpenses({
        search: searchQuery || undefined,
        method: methodFilter !== "all" ? (methodFilter as PaymentMethod) : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
      }),
  });

  const expenses = result?.data || [];
  const totalPages = result?.totalPages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete expense");
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteMutation.mutate(id);
    }
  };

  const categories = Array.from(
    new Set(expenses.map((e) => e.category))
  );

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load expenses</h2>
        <p className="mt-1 text-sm text-red-600">The expenses service could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Expenses
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage all expense records
          </p>
        </div>

        <a
          href="/expenses/add"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Method
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {expense.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${methodColors[expense.paymentMethod as PaymentMethod] || "bg-gray-100 text-gray-800"}`}>
                        {expense.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/expenses/${expense.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={`/expenses/edit/${expense.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
};

export default ExpensesPage;
