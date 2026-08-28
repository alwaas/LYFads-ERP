import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createLeadSchema, editLeadSchema, type CreateLeadFormData, type EditLeadFormData } from "../../features/validation/lead.schema";

export type LeadFormData = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  estimatedValue: number;
  remarks: string;
};

type Props = {
  initialValues?: Partial<LeadFormData>;
  onSubmit: (values: LeadFormData) => Promise<void>;
  loading?: boolean;
  serverErrors?: Record<string, string>;
};

type FormData = CreateLeadFormData | EditLeadFormData;

function LeadForm({
  initialValues,
  onSubmit,
  loading = false,
  serverErrors,
}: Props) {
  const schema = initialValues ? editLeadSchema : createLeadSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      status: "NEW",
      source: "OTHER",
      estimatedValue: 0,
      remarks: "",
    },
  });

  useEffect(() => {
    if (!initialValues) return;

    reset({
      companyName: initialValues.companyName ?? "",
      contactPerson: initialValues.contactPerson ?? "",
      email: initialValues.email ?? "",
      phone: initialValues.phone ?? "",
      status: (initialValues.status as FormData["status"]) ?? "NEW",
      source: (initialValues.source as FormData["source"]) ?? "OTHER",
      estimatedValue: Number(initialValues.estimatedValue ?? 0),
      remarks: initialValues.remarks ?? "",
    });
  }, [initialValues, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as unknown as LeadFormData);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-white rounded-lg shadow p-6 space-y-5"
    >
      <div className="grid md:grid-cols-2 gap-5">

        <input
          {...register("companyName")}
          placeholder="Company Name"
          className="border rounded-lg p-3"
        />
        {errors.companyName && (
          <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
        )}

        <input
          {...register("contactPerson")}
          placeholder="Contact Person"
          className="border rounded-lg p-3"
        />
        {errors.contactPerson && (
          <p className="text-red-500 text-xs mt-1">{errors.contactPerson.message}</p>
        )}

        <input
          type="email"
          {...register("email")}
          placeholder="Email"
          className="border rounded-lg p-3"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}

        <input
          {...register("phone")}
          placeholder="Phone"
          className="border rounded-lg p-3"
        />

        <select
          {...register("status")}
          className="border rounded-lg p-3"
        >
          <option value="NEW">NEW</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="QUALIFIED">QUALIFIED</option>
          <option value="PROPOSAL_SENT">PROPOSAL</option>
          <option value="NEGOTIATION">NEGOTIATION</option>
          <option value="WON">WON</option>
          <option value="LOST">LOST</option>
        </select>
        {errors.status && (
          <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
        )}

        <select
          {...register("source")}
          className="border rounded-lg p-3 text-slate-700"
        >
          <option value="" disabled>
            Select Lead Source
          </option>
          <option value="WEBSITE">Website</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="GOOGLE">Google</option>
          <option value="REFERRAL">Referral</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="OTHER">Other</option>
        </select>
        {errors.source && (
          <p className="text-red-500 text-xs mt-1">{errors.source.message}</p>
        )}

        <input
          type="number"
          {...register("estimatedValue", { valueAsNumber: true })}
          placeholder="Estimated Value"
          className="border rounded-lg p-3"
        />
        {errors.estimatedValue && (
          <p className="text-red-500 text-xs mt-1">{errors.estimatedValue.message}</p>
        )}

      </div>

      <textarea
        rows={5}
        {...register("remarks")}
        placeholder="Remarks"
        className="border rounded-lg p-3 w-full"
      />
      {errors.remarks && (
        <p className="text-red-500 text-xs mt-1">{errors.remarks.message}</p>
      )}

      <button
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
      >
        {loading ? "Saving..." : "Save Lead"}
      </button>
    </form>
  );
}

export default LeadForm;
