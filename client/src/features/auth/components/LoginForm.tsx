import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/ui/Input";

import {
  loginSchema,
  type LoginFormData,
} from "../validation/loginSchema";

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginFormData) {
    console.log(data);
  }

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-3xl font-bold">
        Welcome Back
      </h1>

      <p className="mb-6 text-gray-500">
        Sign in to LYFads ERP
      </p>

      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
            />

        </div>

        <div>
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
            />

        </div>

        <button
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginForm;