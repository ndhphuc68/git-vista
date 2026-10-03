import React from "react";
import clsx from "clsx";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * Shared checkbox. Renders only the box so callers keep control of the
 * surrounding `<label>` layout.
 */
export const Checkbox: React.FC<CheckboxProps> = ({ className, ...rest }) => (
  <input
    type="checkbox"
    className={clsx(
      "w-3.5 h-3.5 shrink-0 rounded-sm accent-accent cursor-pointer",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...rest}
  />
);
