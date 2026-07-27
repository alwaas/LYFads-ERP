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
};

type Props = {
  loading: boolean;
  onSubmit: (data: ClientFormData) => void;
  defaultValues?: ClientFormData;
};

function ClientForm({ loading, onSubmit, defaultValues, }: Props) {
  const {
    register,
    handleSubmit,
  } = useForm<ClientFormData>({defaultValues,});

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl shadow-md p-6 space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div>
          <label className="block mb-1 font-medium">
            Company Name
          </label>

          <input
            {...register("companyName", {
              required: true,
            })}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Contact Person
          </label>

          <input
            {...register("contactPerson", {
              required: true,
            })}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Email
          </label>

          <input
            type="email"
            {...register("email", {
              required: true,
            })}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Phone
          </label>

          <input
            {...register("phone")}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Website
          </label>

          <input
            {...register("website")}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
            <label className="block mb-1 font-medium">
                GST Number
            </label>

            <input
                {...register("gstNumber")}
                className="w-full border rounded-lg px-4 py-2"
            />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 font-medium">
            Address
          </label>

          <textarea
            {...register("address")}
            rows={3}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            City
          </label>

          <input
            {...register("city")}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            State
          </label>

          <input
            {...register("state")}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Country
          </label>

          <input
            {...register("country")}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Client"}
      </button>
    </form>
  );
}

export default ClientForm;