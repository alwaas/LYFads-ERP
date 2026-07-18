import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
}

function Button({
  children,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={clsx(
        "flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition",
        "hover:bg-blue-700",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}

export default Button;