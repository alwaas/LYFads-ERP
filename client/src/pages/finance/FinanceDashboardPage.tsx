import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileText,
  Receipt,
  ClipboardList,
  TrendingUp,
  BookOpen,
  Wallet,
} from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import { financeService } from "../../services/finance.service";

const FinanceDashboardPage = () => {
  const { data: accounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ["finance-accounts"],
    queryFn: () => financeService.getAccounts(1, 50),
  });

  const { data: journalEntries, isLoading: loadingJournals } = useQuery({
    queryKey: ["finance-journal-entries"],
    queryFn: () => financeService.getJournalEntries(1, 10),
  });

  const { data: tb, isLoading: loadingTb } = useQuery({
    queryKey: ["finance-trial-balance"],
    queryFn: () => financeService.getTrialBalance(),
  });

  const { data: pnl, isLoading: loadingPnl } = useQuery({
    queryKey: ["finance-pnl"],
    queryFn: () => financeService.getProfitAndLoss(),
  });

  if (loadingAccounts || loadingJournals || loadingTb || loadingPnl) {
    return <PageLoader />;
  }

  const quickLinks = [
    { title: "Chart of Accounts", path: "/finance/accounts", icon: BookOpen, color: "bg-blue-500" },
    { title: "Journal Entries", path: "/finance/journal-entries", icon: ClipboardList, color: "bg-purple-500" },
    { title: "Trial Balance", path: "/finance/trial-balance", icon: Receipt, color: "bg-green-500" },
    { title: "Profit & Loss", path: "/finance/profit-loss", icon: TrendingUp, color: "bg-orange-500" },
    { title: "General Ledger", path: "/finance/general-ledger", icon: FileText, color: "bg-indigo-500" },
  ];

  const accountCount = accounts?.data?.length ?? 0;
  const journalCount = journalEntries?.total ?? 0;
  const totalAssets = tb?.totalAssets ?? 0;
  const netIncome = pnl?.netIncome ?? 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-gray-600">General Ledger, Chart of Accounts, and Financial Reports</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className={`${link.color} p-3 rounded-full text-white mb-2`}>
                <link.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-800">{link.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accounts in CoA</p>
              <p className="text-2xl font-bold text-gray-900">{accountCount}</p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-300" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Journal Entries</p>
              <p className="text-2xl font-bold text-gray-900">{journalCount}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-gray-300" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">${totalAssets.toLocaleString()}</p>
            </div>
            <Wallet className="h-8 w-8 text-gray-300" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${netIncome.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-300" />
          </div>
        </div>
      </div>

      {journalEntries?.data && journalEntries.data.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 p-4 border-b">Recent Journal Entries</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {journalEntries.data.slice(0, 5).map((entry: any) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{entry.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{entry.referenceId}</td>
                  <td className="px-6 py-4 text-sm text-right">{entry.posted ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboardPage;
