import { useState } from "react";
import type { Lead } from "../../types/lead";

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
  initialValues?: Partial<Lead>;
  onSubmit: (values: LeadFormData) => Promise<void>;
  loading?: boolean;
};

function LeadForm({
  initialValues,
  onSubmit,
  loading = false,
}: Props) {
  const [form, setForm] = useState<LeadFormData>({
    companyName: initialValues?.companyName ?? "",
    contactPerson: initialValues?.contactPerson ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    status: initialValues?.status ?? "NEW",
    source: initialValues?.source ?? "",
    estimatedValue: Number(initialValues?.estimatedValue ?? 0),
    remarks: initialValues?.remarks ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "estimatedValue"
          ? Number(value)
          : value,
    }));
  };

  const submit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    await onSubmit(form);
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-lg shadow p-6 space-y-5"
    >
      <div className="grid md:grid-cols-2 gap-5">

        <input
          name="companyName"
          placeholder="Company Name"
          value={form.companyName}
          onChange={handleChange}
          required
          className="border rounded-lg p-3"
        />

        <input
          name="contactPerson"
          placeholder="Contact Person"
          value={form.contactPerson}
          onChange={handleChange}
          required
          className="border rounded-lg p-3"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border rounded-lg p-3"
        >
          <option value="NEW">NEW</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="QUALIFIED">QUALIFIED</option>
          <option value="PROPOSAL">PROPOSAL</option>
          <option value="NEGOTIATION">NEGOTIATION</option>
          <option value="WON">WON</option>
          <option value="LOST">LOST</option>
        </select>

        <select
          name="source"
          value={form.source}
          onChange={handleChange}
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

        <input
          type="number"
          name="estimatedValue"
          placeholder="Estimated Value"
          value={form.estimatedValue}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

      </div>

      <textarea
        rows={5}
        name="remarks"
        placeholder="Remarks"
        value={form.remarks}
        onChange={handleChange}
        className="border rounded-lg p-3 w-full"
      />

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