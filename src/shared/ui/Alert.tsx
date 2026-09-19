import React from "react";
import clsx from "clsx";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export type AlertVariant = "error" | "warning" | "info" | "success";

export interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

const VARIANT_STYLE: Record<AlertVariant, string> = {
  error: "bg-diff-remove-bg border-diff-remove-text/30 text-diff-remove-text",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  info: "bg-accent-subtle/40 border-accent-subtle text-secondary",
  success: "bg-diff-add-bg border-diff-add-border text-diff-add-text",
};

const VARIANT_ICON: Record<AlertVariant, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

/**
 * A notification block used in modals and forms.
 *
 * Only the "error" variant carries role="alert" — screen readers announce
 * it immediately when it appears. The other variants are supplementary
 * information, so they shouldn't interrupt the user.
 */
export const Alert: React.FC<AlertProps> = ({ variant, children, showIcon = true, className }) => {
  const Icon = VARIANT_ICON[variant];

  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={clsx(
        "flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-normal",
        VARIANT_STYLE[variant],
        className
      )}
    >
      {showIcon && <Icon size={14} className="shrink-0 mt-0.5" aria-hidden="true" />}
      <span className="min-w-0">{children}</span>
    </div>
  );
};
