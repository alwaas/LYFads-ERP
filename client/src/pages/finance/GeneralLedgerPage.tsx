import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter } from "lucide-react";
import PageLoader from "../../components/common/PageLoader";
import { financeService, type GeneralLedgerEntry } from "../../services/finance.service";

const GeneralLedgerPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: glEntries, isLoading } = useQuery<GeneralLedgerEntry[]>({
    queryKey: ["finance-general-ledger", dateFrom, dateTo],
    queryFn: () => financeService.getGeneralLedger({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  });

  if (isLoading) return <PageLoader />;

  const entries = glEntries || [];
  const totalDebit = entries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.creditAmount, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">General Ledger</h1>
          <p className="text-gray-600">All journal entry lines with account details</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry, index) => (
              <tr key={`${entry.accountCode}-${entry.date}-${index}`}>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="font-mono text-gray-700">{entry.accountCode}</span>
                  <span className="text-gray-500"> — {entry.accountName}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{entry.description || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{entry.referenceId || "—"}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">
                  {entry.debitAmount > 0 ? `$${entry.debitAmount.toFixed(2)}` : ""}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">
                  {entry.creditAmount > 0 ? `$${entry.creditAmount.toFixed(2)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-700">Totals:</td>
              <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">${totalDebit.toFixed(2)}</td>
              <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">${totalCredit.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {entries.length} entries &nbsp;|&nbsp; Total Debits: ${totalDebit.toFixed(2)} &nbsp;|&nbsp; Total Credits: ${totalCredit.toFixed(2)}
        {" "} &nbsp;|&nbsp; {Math.abs(totalDebit - totalCredit) < 0.01 ? "Balanced" : "Not Balanced"}
      </div>
    </div>
  );
};

export default GeneralLedgerPage;
