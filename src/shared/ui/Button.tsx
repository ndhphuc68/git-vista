import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

const BASE =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold " +
  "cursor-pointer transition-all active:scale-[0.98] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-contrast border-none hover:bg-accent-hover",
  secondary:
    "bg-transparent text-primary border border-border-subtle hover:bg-surface-hover font-medium",
  danger: "bg-diff-remove-text text-white border-none hover:opacity-90",
  ghost: "bg-transparent text-secondary border-none hover:text-primary hover:bg-surface-hover",
};

/**
 * Nút bấm dùng chung. Không biết gì về nghiệp vụ Git — nhận mọi thứ qua props.
 *
 * `loading` tự vô hiệu hoá nút và hiện spinner, nên nơi gọi không phải tự
 * quản lý hai thứ đó riêng.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(BASE, VARIANT[variant], className)}
      {...rest}
    >
      {loading && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};
