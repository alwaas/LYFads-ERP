import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PageLoader from "../../components/common/PageLoader";
import { financeService, type JournalEntry, type JournalEntryLine } from "../../services/finance.service";

const ViewJournalEntryPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: entries,
    isLoading,
  } = useQuery<{ data: JournalEntry[] }>({
    queryKey: ["finance-journal-entries", id],
    queryFn: () => financeService.getJournalEntries(1, 100, id ? { referenceId: id } : undefined),
  });

  if (isLoading) return <PageLoader />;

  const allEntries: JournalEntry[] = entries?.data || [];
  const entry: JournalEntry | undefined = allEntries.find((e: JournalEntry) => e.id === id) || allEntries[0];

  if (!entry) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-gray-500">Journal entry not found.</p>
      </div>
    );
  }

  const totalDebit = entry.lines.reduce((sum: number, line: JournalEntryLine) => sum + Number(line.debitAmount), 0);
  const totalCredit = entry.lines.reduce((sum: number, line: JournalEntryLine) => sum + Number(line.creditAmount), 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/finance/journal-entries" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Journal Entry</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-gray-900 font-medium">{new Date(entry.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Posted</p>
            <p className="text-gray-900 font-medium">
              {entry.posted ? "Yes" : "No"}
            </p>
          </div>
          {entry.referenceId && (
            <div>
              <p className="text-sm text-gray-500">Reference ID</p>
              <p className="text-gray-900 font-medium">{entry.referenceId}</p>
            </div>
          )}
          {entry.description && (
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900 font-medium">{entry.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entry.lines.map((line: JournalEntryLine) => (
              <tr key={line.id}>
                <td className="px-6 py-4 text-sm">
                  <div className="font-mono text-gray-700">{line.account.code}</div>
                  <div className="text-gray-500">{line.account.name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{line.description || "—"}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">
                  {Number(line.debitAmount) > 0 ? `$${Number(line.debitAmount).toFixed(2)}` : "—"}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">
                  {Number(line.creditAmount) > 0 ? `$${Number(line.creditAmount).toFixed(2)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={2} className="px-6 py-4 text-right text-sm font-medium text-gray-700">Totals:</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">${totalDebit.toFixed(2)}</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">${totalCredit.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ViewJournalEntryPage;
