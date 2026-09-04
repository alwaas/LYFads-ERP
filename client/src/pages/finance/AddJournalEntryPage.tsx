import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { financeService, type Account, type CreateJournalEntryDto } from "../../services/finance.service";

const accountTypeMap: Record<string, string> = {
  ASSET: "ASSET",
  LIABILITY: "LIABILITY",
  EQUITY: "EQUITY",
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  OTHER: "OTHER",
};

const AddJournalEntryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [posted, setPosted] = useState(true);
  const [lines, setLines] = useState([
    { accountId: "", description: "", debitAmount: "", creditAmount: "" },
    { accountId: "", description: "", debitAmount: "", creditAmount: "" },
  ]);

  const { data: accountsData } = useQuery<{
    data: Account[];
    total: number;
  }>({
    queryKey: ["finance-accounts-all"],
    queryFn: () => financeService.getAccounts(1, 200),
  });

  const accounts = accountsData?.data || [];

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { accountId: "", description: "", debitAmount: "", creditAmount: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const mutation = useMutation({
    mutationFn: (dto: CreateJournalEntryDto) => financeService.createJournalEntry(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-journal-entries"] });
      toast.success("Journal entry created successfully");
      navigate("/finance/journal-entries");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to create journal entry"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lineInputs = lines.map((line) => ({
      accountId: line.accountId,
      description: line.description || undefined,
      debitAmount: line.debitAmount || undefined,
      creditAmount: line.creditAmount || undefined,
    }));

    mutation.mutate({
      date,
      description: description || undefined,
      referenceId: referenceId || undefined,
      posted,
      lines: lineInputs,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Journal Entry</h1>
        <p className="text-gray-600">Create a new journal entry</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference ID</label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. invoice_123"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={posted}
                onChange={(e) => setPosted(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Mark as posted</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Journal entry description..."
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lines</h3>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Account</label>
                  <select
                    value={line.accountId}
                    onChange={(e) => updateLine(index, "accountId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(index, "description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Memo"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Debit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.debitAmount}
                    onChange={(e) => updateLine(index, "debitAmount", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Credit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.creditAmount}
                    onChange={(e) => updateLine(index, "creditAmount", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2 flex gap-2">
                  {lines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="p-2 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              Add Line
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between">
            <div>
              <span className="text-sm font-medium text-gray-600">Total Debit: </span>
              <span className="text-lg font-bold text-gray-900">${totalDebit.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Total Credit: </span>
              <span className="text-lg font-bold text-gray-900">${totalCredit.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">Status: </span>
              <span className={isBalanced ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                {isBalanced ? "Balanced" : "Not Balanced"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/finance/journal-entries")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !isBalanced}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending ? "Saving..." : "Save Journal Entry"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddJournalEntryPage;
