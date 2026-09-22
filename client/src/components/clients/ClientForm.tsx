import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createClientSchema, editClientSchema, type CreateClientFormData, type EditClientFormData } from "../../features/validation/client.schema";

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
  serverErrors?: Record<string, string>;
};

type FormData = CreateClientFormData | EditClientFormData;

function ClientForm({ loading, onSubmit, defaultValues, serverErrors }: Props) {
  const schema = defaultValues ? editClientSchema : createClientSchema;

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
      website: "",
      gstNumber: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      ...defaultValues,
    } as any,
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        companyName: defaultValues.companyName,
        contactPerson: defaultValues.contactPerson,
        email: defaultValues.email,
        phone: defaultValues.phone || "",
        website: defaultValues.website || "",
        gstNumber: defaultValues.gstNumber || "",
        address: defaultValues.address || "",
        city: defaultValues.city || "",
        state: defaultValues.state || "",
        country: defaultValues.country || "",
        pincode: defaultValues.pincode || "",
      });
    }
  }, [defaultValues, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as unknown as ClientFormData);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-white rounded-xl shadow-xs p-6 space-y-5 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Company Name *
          </label>
          <input
            {...register("companyName")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter company name"
          />
          {errors.companyName && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Contact Person *
          </label>
          <input
            {...register("contactPerson")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter contact person name"
          />
          {errors.contactPerson && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.contactPerson.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Email *
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
          )}
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
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone.message}</p>
          )}
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
          {errors.website && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.website.message}</p>
          )}
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
          {errors.gstNumber && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.gstNumber.message}</p>
          )}
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
          {errors.address && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.address.message}</p>
          )}
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
          {errors.city && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.city.message}</p>
          )}
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
          {errors.state && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.state.message}</p>
          )}
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
          {errors.country && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.country.message}</p>
          )}
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
          {errors.pincode && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.pincode.message}</p>
          )}
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
