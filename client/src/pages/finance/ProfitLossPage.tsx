import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import { financeService } from "../../services/finance.service";

const ProfitLossPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: pnl, isLoading } = useQuery<{
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    byAccount: Array<{ accountId: string; code: string; name: string; type: string; amount: number }>;
  }>({
    queryKey: ["finance-pnl", dateFrom, dateTo],
    queryFn: () => financeService.getProfitAndLoss({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  });

  if (isLoading) return <PageLoader />;

  const incomeAccounts = pnl?.byAccount.filter((a) => a.type === "INCOME") || [];
  const expenseAccounts = pnl?.byAccount.filter((a) => a.type === "EXPENSE") || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss</h1>
          <p className="text-gray-600">Income statement summary</p>
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

      {pnl && (
        <>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">${pnl.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm text-gray-500 mb-2">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">${pnl.totalExpenses.toFixed(2)}</p>
            </div>
            <div className={`bg-white p-6 rounded-lg shadow text-center ${pnl.netIncome >= 0 ? "border-green-500" : "border-red-500"} border-t-4`}>
              <p className="text-sm text-gray-500 mb-2">Net Income</p>
              <div className="flex items-center justify-center gap-2">
                {pnl.netIncome >= 0 ? <TrendingUp className="h-6 w-6 text-green-600" /> : <TrendingDown className="h-6 w-6 text-red-600" />}
                <p className={`text-3xl font-bold ${pnl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${pnl.netIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
            <h2 className="text-xl font-semibold text-gray-800 p-4 border-b">Revenue</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incomeAccounts.map((account) => (
                  <tr key={account.accountId}>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{account.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.name}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">${account.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-6 py-4 text-right text-sm font-medium text-gray-700">Total Revenue:</td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">${pnl.totalRevenue.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <h2 className="text-xl font-semibold text-gray-800 p-4 border-b">Expenses</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenseAccounts.map((account) => (
                  <tr key={account.accountId}>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{account.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.name}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">${account.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-6 py-4 text-right text-sm font-medium text-gray-700">Total Expenses:</td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">${pnl.totalExpenses.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfitLossPage;
