import { useForm } from "react-hook-form";

export type ClientFormData = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
};

type Props = {
  loading: boolean;
  onSubmit: (data: ClientFormData) => void;
  defaultValues?: ClientFormData;
};

function ClientForm({ loading, onSubmit, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
  } = useForm<ClientFormData>({ defaultValues });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl shadow-xs p-6 space-y-5 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Company Name *
          </label>
          <input
            {...register("companyName", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Contact Person *
          </label>
          <input
            {...register("contactPerson", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter contact person name"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Email *
          </label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Phone
          </label>
          <input
            {...register("phone")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Website
          </label>
          <input
            {...register("website")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            GST Number
          </label>
          <input
            {...register("gstNumber")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter GST number"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Address
          </label>
          <textarea
            {...register("address")}
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter full address"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            City
          </label>
          <input
            {...register("city")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            State
          </label>
          <input
            {...register("state")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter state"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Country
          </label>
          <input
            {...register("country")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter country"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Pincode
          </label>
          <input
            {...register("pincode")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter pincode"
          />
        </div>

      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? "Saving..." : "Save Client"}
        </button>
      </div>
    </form>
  );
}

export default ClientForm;