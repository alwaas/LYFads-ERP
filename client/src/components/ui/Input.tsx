import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

function Input({
  label,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <input
        {...props}
        className={clsx(
          "w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
          error && "border-red-500 focus:border-red-500 focus:ring-red-200",
          className
        )}
      />

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;