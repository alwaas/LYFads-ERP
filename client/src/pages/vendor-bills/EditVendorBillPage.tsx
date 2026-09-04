import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Receipt, ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { vendorBillService } from "../../services/vendor-bill.service";
import { vendorService } from "../../services/vendor.service";
import { mapServerValidationErrors } from "../../features/validation/errors";
import {
  updateVendorBillSchema,
  type UpdateVendorBillFormData,
  type CreateVendorBillItemFormData,
} from "../../features/validation/vendor-bill.schema";
import type { UpdateVendorBillDto, VendorBill, VendorBillItem } from "../../types/vendor-bill";

interface ItemDraft {
  description: string;
  quantity: string;
  unitCost: string;
  discount: string;
  tax: string;
  lineTotal: string;
}

const toItemDraft = (it: VendorBillItem): ItemDraft => ({
  description: it.description ?? "",
  quantity: (it.quantity ?? 0).toString(),
  unitCost: (it.unitCost ?? 0).toString(),
  discount: (it.discount ?? 0).toString(),
  tax: (it.tax ?? 0).toString(),
  lineTotal: (it.lineTotal ?? 0).toString(),
});

const computeLine = (it: ItemDraft): string => {
  const qty = Number(it.quantity) || 0;
  const cost = Number(it.unitCost) || 0;
  const disc = Number(it.discount) || 0;
  const tax = Number(it.tax) || 0;
  return (qty * cost - disc + tax).toFixed(2);
};

const EditVendorBillPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [items, setItems] = useState<ItemDraft[]>([toItemDraft({} as VendorBillItem)]);

  const { data: bill, isLoading } = useQuery<VendorBill>({
    queryKey: ["vendor-bill", id],
    queryFn: () => vendorBillService.getVendorBillById(id!),
    enabled: !!id,
  });

  const { data: vendorsResp } = useQuery({
    queryKey: ["vendors-all"],
    queryFn: () => vendorService.getAllVendors({ limit: 100 }),
  });
  const vendors = (vendorsResp as any)?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<UpdateVendorBillFormData>({
    resolver: zodResolver(updateVendorBillSchema) as any,
  });

  useEffect(() => {
    if (bill) {
      setIsReadOnly(bill.status !== "DRAFT");
      reset({
        invoiceNumber: bill.invoiceNumber,
        vendorId: bill.vendorId,
        dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : "",
        notes: bill.notes || "",
      });
      setItems((bill.items || []).map(toItemDraft));
    }
  }, [bill, reset]);

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateVendorBillDto) => vendorBillService.updateVendorBill(id!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-bill", id] });
      toast.success("Vendor bill updated");
      navigate("/vendor-bills");
    },
    onError: (error: unknown) => {
      const fieldErrors = mapServerValidationErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof UpdateVendorBillFormData, { message });
        });
      } else {
        toast.error(
          (error as any)?.response?.data?.message ||
            (error as any)?.message ||
            "Failed to update vendor bill",
        );
      }
    },
  });

  const updateItem = (index: number, field: keyof ItemDraft, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], [field]: value };
      cur.lineTotal = computeLine(cur);
      next[index] = cur;
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const calculateTotals = () => {
    const itemsSubtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unitCost) || 0;
      const disc = Number(item.discount) || 0;
      return sum + (qty * cost - disc);
    }, 0);
    return { subtotal: itemsSubtotal.toFixed(2) };
  };

  const validateItems = (): boolean => {
    const errs: string[] = [];
    items.forEach((it, i) => {
      if (!it.description) errs.push(`Item ${i + 1}: Description is required`);
      const qty = Number(it.quantity);
      if (!Number.isFinite(qty) || qty <= 0) errs.push(`Item ${i + 1}: Quantity must be > 0`);
      const cost = Number(it.unitCost);
      if (!Number.isFinite(cost) || cost < 0) errs.push(`Item ${i + 1}: Unit cost must be >= 0`);
    });
    if (errs.length > 0) {
      toast.error(errs[0]);
      return false;
    }
    return true;
  };

  const onSubmit = async (data: UpdateVendorBillFormData) => {
    if (!validateItems()) return;
    const { subtotal } = calculateTotals();
    const payload: UpdateVendorBillDto = {
      invoiceNumber: data.invoiceNumber,
      vendorId: data.vendorId,
      dueDate: data.dueDate,
      notes: data.notes,
      items: items.map((it, idx): CreateVendorBillItemFormData => ({
        description: it.description,
        quantity: it.quantity,
        unitCost: it.unitCost,
        discount: it.discount,
        tax: it.tax,
        lineTotal: it.lineTotal,
        sequence: idx,
      })),
    };
    void subtotal;
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return <div className="text-slate-500 text-center py-8">Loading vendor bill...</div>;
  }

  if (!bill) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Vendor bill not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/vendor-bills")} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Vendor Bill</h1>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                {
                  DRAFT: "bg-gray-100 text-gray-800",
                  APPROVED: "bg-amber-100 text-amber-800",
                  POSTED: "bg-blue-100 text-blue-800",
                  PARTIALLY_PAID: "bg-orange-100 text-orange-800",
                  PAID: "bg-green-100 text-green-800",
                  VOIDED: "bg-red-100 text-red-800",
                  CANCELLED: "bg-slate-100 text-slate-800",
                }[bill.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {bill.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isReadOnly ? "Bills are locked once they leave DRAFT" : "Update draft vendor bill"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Invoice Number *</label>
              <input
                type="text"
                {...register("invoiceNumber")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.invoiceNumber.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vendor *</label>
              <select
                {...register("vendorId")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Select a vendor</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.vendorId && (
                <p className="mt-1 text-xs text-red-600">{errors.vendorId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Due Date *</label>
              <input
                type="date"
                {...register("dueDate")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Balance</label>
              <input
                type="text"
                readOnly
                value={Number(bill.balanceAmount).toFixed(2)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea
                rows={3}
                {...register("notes")}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h3>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No items</p>
            ) : (
              <div className="space-y-4">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-4 lg:grid-cols-12 rounded-lg border border-slate-200 p-4">
                    <div className="lg:col-span-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost</label>
                      <input
                        type="number"
                        value={it.unitCost}
                        onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
                      <input
                        type="number"
                        value={it.discount}
                        onChange={(e) => updateItem(idx, "discount", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
                      <input
                        type="number"
                        value={it.tax}
                        onChange={(e) => updateItem(idx, "tax", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Line Total</label>
                      <input
                        type="text"
                        readOnly
                        value={it.lineTotal}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
                      />
                    </div>
                    <div className="lg:col-span-1 flex items-end">
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isReadOnly && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/vendor-bills")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditVendorBillPage;
