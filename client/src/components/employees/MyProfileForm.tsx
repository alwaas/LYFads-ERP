import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { selfProfileSchema, type SelfProfileFormData } from "../../features/validation/employee.schema";

type Props = {
  onSubmit: (data: SelfProfileFormData) => void;
  loading?: boolean;
  defaultValues?: Partial<SelfProfileFormData>;
  serverErrors?: Record<string, string>;
};

function MyProfileForm({
  onSubmit,
  loading = false,
  defaultValues,
  serverErrors,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<SelfProfileFormData>({
    resolver: zodResolver(selfProfileSchema) as any,
    defaultValues: {
      phone: "",
      department: "",
      designation: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      bankName: "",
      bankAccountNumber: "",
      ifscCode: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        phone: defaultValues.phone || "",
        department: defaultValues.department || "",
        designation: defaultValues.designation || "",
        address: defaultValues.address || "",
        city: defaultValues.city || "",
        state: defaultValues.state || "",
        country: defaultValues.country || "",
        pincode: defaultValues.pincode || "",
        bankName: defaultValues.bankName || "",
        bankAccountNumber: defaultValues.bankAccountNumber || "",
        ifscCode: defaultValues.ifscCode || "",
        emergencyContactName: defaultValues.emergencyContactName || "",
        emergencyContactPhone: defaultValues.emergencyContactPhone || "",
        ...defaultValues,
      });
    }
  }, [defaultValues, reset]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      clearErrors();
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof SelfProfileFormData, { message });
      });
    }
  }, [serverErrors, setError, clearErrors]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Phone
          </label>
          <input
            {...register("phone")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter phone number"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.phone?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Department
          </label>
          <input
            {...register("department")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter department"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.department?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Designation
          </label>
          <input
            {...register("designation")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter designation"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.designation?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Address
          </label>
          <input
            {...register("address")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter address"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.address?.message}
          </p>
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
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.city?.message}
          </p>
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
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.state?.message}
          </p>
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
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.country?.message}
          </p>
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
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.pincode?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Bank Name
          </label>
          <input
            {...register("bankName")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter bank name"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.bankName?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Bank Account Number
          </label>
          <input
            {...register("bankAccountNumber")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter bank account number"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.bankAccountNumber?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            IFSC Code
          </label>
          <input
            {...register("ifscCode")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter IFSC code"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.ifscCode?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Emergency Contact Name
          </label>
          <input
            {...register("emergencyContactName")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter emergency contact name"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.emergencyContactName?.message}
          </p>
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-700">
            Emergency Contact Phone
          </label>
          <input
            {...register("emergencyContactPhone")}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
            placeholder="Enter emergency contact phone"
          />
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.emergencyContactPhone?.message}
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? "Saving..." : "Update Profile"}
        </button>
      </div>
    </form>
  );
}

export default MyProfileForm;
