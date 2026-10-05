import React from "react";
import clsx from "clsx";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "data-testid"?: string;
}

/**
 * Shared on/off toggle (`role="switch"`). Knows nothing about what it
 * toggles; the caller names it via `aria-label` or `aria-labelledby`.
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  id,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "data-testid": testId,
}) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    data-testid={testId}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={clsx(
      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
      "transition-colors duration-200 ease-in-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      "disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-accent" : "bg-border-strong"
    )}
  >
    <span
      aria-hidden="true"
      className={clsx(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm",
        "transition-transform duration-200 ease-in-out",
        checked ? "translate-x-4" : "translate-x-0"
      )}
    />
  </button>
);
