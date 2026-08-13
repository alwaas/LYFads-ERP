import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { invoiceService } from "../../services/invoice.service";
import { getClients } from "../../services/client.service";
import { projectService } from "../../services/project.service";
import type { CreateInvoiceDto } from "../../types/invoice";
import type { Client } from "../../types/client";
import type { Project } from "../../types/project";

interface InvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

const AddInvoicePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateInvoiceDto>({
    invoiceNumber: "",
    clientId: "",
    projectId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subtotal: "0",
    tax: "0",
    discount: "0",
    total: "0",
    balanceAmount: "0",
    status: "DRAFT",
    notes: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: "1", unitPrice: "0", amount: "0" },
  ]);

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => projectService.getAllProjects(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateInvoiceDto) => invoiceService.createInvoice(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      navigate("/invoices");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to create invoice";
      toast.error(message);
    },
  });

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = Number(formData.tax) || 0;
    const discount = Number(formData.discount) || 0;
    const total = subtotal + tax - discount;
    return { subtotal, total };
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Recalculate line amount
    if (field === "quantity" || field === "unitPrice") {
      const quantity = Number(newItems[index].quantity) || 0;
      const unitPrice = Number(newItems[index].unitPrice) || 0;
      newItems[index].amount = (quantity * unitPrice).toFixed(2);
    }
    
    setItems(newItems);
    
    // Update totals
    const { subtotal, total } = calculateTotals();
    setFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      balanceAmount: total.toFixed(2),
    }));
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: "1", unitPrice: "0", amount: "0" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    const { subtotal, total } = calculateTotals();
    setFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      balanceAmount: total.toFixed(2),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/invoices")}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Add Invoice
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create a new invoice
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-slate-700 mb-2">
                Invoice Number *
              </label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="INV-001"
              />
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-2">
                Client *
              </label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                required
                disabled={isLoadingClients}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 mb-2">
                Project
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                disabled={isLoadingProjects}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a project (optional)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="issueDate" className="block text-sm font-medium text-slate-700 mb-2">
                Issue Date *
              </label>
              <input
                type="date"
                id="issueDate"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-4">
              Invoice Items
            </label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Amount"
                      value={item.amount}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <label htmlFor="tax" className="block text-sm font-medium text-slate-700 mb-2">
                Tax
              </label>
              <input
                type="number"
                id="tax"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-slate-700 mb-2">
                Discount
              </label>
              <input
                type="number"
                id="discount"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="total" className="block text-sm font-medium text-slate-700 mb-2">
                Total *
              </label>
              <input
                type="number"
                id="total"
                name="total"
                value={formData.total}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter any additional notes"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvoicePage;
