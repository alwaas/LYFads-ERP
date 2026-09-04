import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Edit, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageLoader from "../../components/common/PageLoader";
import { financeService, type Account } from "../../services/finance.service";

const AccountTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    ASSET: "bg-blue-100 text-blue-800",
    LIABILITY: "bg-orange-100 text-orange-800",
    EQUITY: "bg-purple-100 text-purple-800",
    INCOME: "bg-green-100 text-green-800",
    EXPENSE: "bg-red-100 text-red-800",
    OTHER: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.OTHER}`}>
      {type}
    </span>
  );
};

const ChartOfAccountsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const {
    data: accounts,
    isLoading,
    isError,
  } = useQuery<{
    data: Account[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["finance-accounts", page, searchQuery],
    queryFn: () => financeService.getAccounts(page, limit),
  });

  const seedMutation = useMutation({
    mutationFn: () => financeService.seedAccounts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      toast.success("Default accounts seeded");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to seed accounts"),
  });

  if (isLoading) return <PageLoader />;

  const filteredAccounts = (accounts?.data || []).filter((account) =>
    account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600">Manage your general ledger accounts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => seedMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            Seed Defaults
          </button>
          <Link
            to="/finance/accounts/add"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Normal Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAccounts.map((account) => (
              <tr key={account.id}>
                <td className="px-6 py-4 text-sm font-mono text-gray-700">{account.code}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{account.name}</td>
                <td className="px-6 py-4"><AccountTypeBadge type={account.type} /></td>
                <td className="px-6 py-4 text-sm text-gray-700">{account.normalBalanceSide}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {account.isActive ? "Yes" : "No"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {}}
                    className="p-1 text-gray-600 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {accounts && accounts.total > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {accounts.data.length} of {accounts.total} accounts
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsPage;
