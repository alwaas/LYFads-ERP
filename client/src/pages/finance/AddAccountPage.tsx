import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { financeService } from "../../services/finance.service";

const accountTypes = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE", "OTHER"];
const balanceSides = ["DEBIT", "CREDIT"];

const AddAccountPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "ASSET",
    normalBalanceSide: "DEBIT",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const mutation = useMutation({
    mutationFn: () => financeService.createAccount(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      toast.success("Account created successfully");
      navigate("/finance/accounts");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to create account"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Account</h1>
        <p className="text-gray-600">Create a new chart of accounts entry</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Cash"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {accountTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Normal Balance Side</label>
            <select
              value={formData.normalBalanceSide}
              onChange={(e) => handleChange("normalBalanceSide", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {balanceSides.map((side) => (
                <option key={side} value={side}>{side}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/finance/accounts")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending ? "Saving..." : "Save Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAccountPage;
