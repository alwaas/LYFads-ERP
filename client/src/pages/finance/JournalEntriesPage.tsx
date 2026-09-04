import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageLoader from "../../components/common/PageLoader";
import Pagination from "../../components/ui/Pagination";
import { financeService, type JournalEntry } from "../../services/finance.service";

const JournalEntriesPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: result,
    isLoading,
    isError,
  } = useQuery<{
    data: JournalEntry[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["finance-journal-entries", page, searchQuery],
    queryFn: () => financeService.getJournalEntries(page, limit),
  });

  if (isLoading) return <PageLoader />;

  const entries = result?.data || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600">All journal entries (posted and unposted)</p>
        </div>
        <Link
          to="/finance/journal-entries/add"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Journal Entry
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search journal entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lines</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Posted</th>
              <th className="px-6 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{entry.description || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{entry.referenceId || "—"}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-700">{entry.lines?.length || 0}</td>
                <td className="px-6 py-4 text-center">
                  <span className={entry.posted ? "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs" : "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs"}>
                    {entry.posted ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/finance/journal-entries/${entry.id}`}
                    className="p-1 text-gray-600 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result && result.totalPages > 1 && (
        <Pagination
          current={result.page}
          total={result.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default JournalEntriesPage;
