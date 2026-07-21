import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import useToggle from "../../../hooks/useToggle";

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

    const password = useToggle();

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
            type={password.value ? "text" : "password"}
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            rightIcon={
                <button
                type="button"
                onClick={password.toggle}
                className="cursor-pointer text-slate-500"
                >
                {password.value ? (
                    <EyeOff size={18} />
                ) : (
                    <Eye size={18} />
                )}
                </button>
            }
            {...register("password")}
            />
        </div>

        <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
                <input type="checkbox" />
                Remember Me
            </label>

            <button
                type="button"
                className="text-blue-600 hover:underline"
            >
                Forgot Password?
            </button>
        </div>

        <Button type="submit">
            Login
        </Button>
      </form>
    </div>
  );
}

export default LoginForm;