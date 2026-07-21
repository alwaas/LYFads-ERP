import clsx from "clsx";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  rightIcon?: ReactNode;
}

function Input({
  label,
  error,
  rightIcon,
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

      <div className="relative">
        <input
          {...props}
          className={clsx(
            "w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none transition",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
            error &&
              "border-red-500 focus:border-red-500 focus:ring-red-200",
            className
          )}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;