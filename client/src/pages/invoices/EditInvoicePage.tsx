import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { invoiceService } from "../../services/invoice.service";
import { getClients } from "../../services/client.service";
import { projectService } from "../../services/project.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import { editInvoiceSchema, type EditInvoiceFormData } from "../../features/validation/invoice.schema";
import type { UpdateInvoiceDto } from "../../types/invoice";
import type { Client } from "../../types/client";
import type { Project } from "../../types/project";

interface InvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

const EditInvoicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [itemErrors, setItemErrors] = useState<string[]>([]);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceService.getInvoiceById(id!),
    enabled: !!id,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => getClients(),
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => projectService.getAllProjects(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<EditInvoiceFormData>({
    resolver: zodResolver(editInvoiceSchema) as any,
    defaultValues: {
      invoiceNumber: "",
      clientId: "",
      projectId: "",
      issueDate: "",
      dueDate: "",
      status: "DRAFT",
      notes: "",
    },
  });

  useEffect(() => {
    if (invoice) {
      reset({
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        projectId: invoice.projectId || "",
        issueDate: invoice.issueDate.split("T")[0],
        dueDate: invoice.dueDate.split("T")[0],
        status: (invoice.status || "DRAFT") as EditInvoiceFormData["status"],
        notes: invoice.notes || "",
      });
      if (invoice.items) {
        setItems(
          invoice.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            amount: item.amount.toString(),
          }))
        );
      }
    }
  }, [invoice, reset]);

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateInvoiceDto) => invoiceService.updateInvoice(id!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast.success("Invoice updated successfully");
      navigate("/invoices");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof EditInvoiceFormData, { message });
        });
      } else {
        const message = (error as any)?.response?.data?.message || (error as any)?.message || "Failed to update invoice";
        toast.error(message);
      }
    },
  });

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = Number((invoice?.tax ?? 0)) || 0;
    const discount = Number((invoice?.discount ?? 0)) || 0;
    const total = subtotal + tax - discount;
    return { subtotal, total };
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === "quantity" || field === "unitPrice") {
      const quantity = Number(newItems[index].quantity) || 0;
      const unitPrice = Number(newItems[index].unitPrice) || 0;
      newItems[index].amount = (quantity * unitPrice).toFixed(2);
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: "1", unitPrice: "0", amount: "0" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const validateItems = (): boolean => {
    const errors: string[] = [];
    items.forEach((item, index) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      if (!item.description.trim()) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (Number.isNaN(qty) || qty <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (Number.isNaN(price) || price < 0) {
        errors.push(`Item ${index + 1}: Unit price must be 0 or greater`);
      }
    });
    setItemErrors(errors);
    return errors.length === 0;
  };

  const onSubmit = async (data: EditInvoiceFormData) => {
    if (!validateItems()) {
      toast.error("Please fix the invoice item errors");
      return;
    }

    const { subtotal, total } = calculateTotals();
    const payload = {
      ...data,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      balanceAmount: total.toFixed(2),
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
    } as any;

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Invoice not found</div>
      </div>
    );
  }

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
              Edit Invoice
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Update invoice details
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-slate-700 mb-2">
                Invoice Number *
              </label>
              <input
                type="text"
                id="invoiceNumber"
                {...register("invoiceNumber")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-2">
                Client *
              </label>
              <select
                id="clientId"
                {...register("clientId")}
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
              {errors.clientId && (
                <p className="mt-1 text-xs text-red-600">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 mb-2">
                Project
              </label>
              <select
                id="projectId"
                {...register("projectId")}
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
                {...register("status")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="issueDate" className="block text-sm font-medium text-slate-700 mb-2">
                Issue Date *
              </label>
              <input
                type="date"
                id="issueDate"
                {...register("issueDate")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.issueDate && (
                <p className="mt-1 text-xs text-red-600">{errors.issueDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                id="dueDate"
                {...register("dueDate")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>
              )}
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
            {itemErrors.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                {itemErrors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
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
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                {...register("notes")}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter any additional notes"
              />
              {errors.notes && (
                <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
              )}
            </div>
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
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? "Updating..." : "Update Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvoicePage;
