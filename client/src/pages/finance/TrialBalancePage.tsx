import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import { financeService, type TrialBalanceEntry } from "../../services/finance.service";

const TrialBalancePage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: tb, isLoading } = useQuery<{
    accounts: TrialBalanceEntry[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    isBalanced: boolean;
  }>({
    queryKey: ["finance-trial-balance", dateFrom, dateTo],
    queryFn: () => financeService.getTrialBalance({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  });

  if (isLoading) return <PageLoader />;

  const accounts = tb?.accounts || [];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ASSET: "text-blue-600",
      LIABILITY: "text-orange-600",
      EQUITY: "text-purple-600",
      INCOME: "text-green-600",
      EXPENSE: "text-red-600",
      OTHER: "text-gray-600",
    };
    return colors[type] || "text-gray-600";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-gray-600">All accounts and their balances</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.accountId}>
                <td className="px-6 py-4 text-sm font-mono text-gray-700">{account.code}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{account.name}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium ${getTypeColor(account.type)}`}>
                    {account.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">${account.debitBalance.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">${account.creditBalance.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">${Math.abs(account.balance).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-700">Summary:</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                Total Debits: ${accounts.reduce((sum, a) => sum + a.debitBalance, 0).toFixed(2)} | Total Credits: ${accounts.reduce((sum, a) => sum + a.creditBalance, 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {tb && (
        <div className="mt-6 grid grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">Assets</p>
            <p className="text-xl font-bold text-gray-900">${tb.totalAssets.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">Liabilities</p>
            <p className="text-xl font-bold text-gray-900">${tb.totalLiabilities.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">Equity</p>
            <p className="text-xl font-bold text-gray-900">${tb.totalEquity.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-xl font-bold text-gray-900">${tb.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="text-xl font-bold text-gray-900">${tb.totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      )}

      {tb && (
        <div className={`mt-4 p-3 rounded-lg text-center ${tb.isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <strong>{tb.isBalanced ? "Balanced" : "Not Balanced"}</strong> — Assets ({tb.totalAssets.toFixed(2)}) = Liabilities ({tb.totalLiabilities.toFixed(2)}) + Equity ({tb.totalEquity.toFixed(2)})
        </div>
      )}
    </div>
  );
};

export default TrialBalancePage;