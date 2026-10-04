import React from "react";
import clsx from "clsx";

export interface SettingsRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Id of the control; renders the label as a `<label>`. */
  htmlFor?: string;
  /** Id for the label, for controls named through `aria-labelledby`. */
  labelId?: string;
  help?: React.ReactNode;
  disabled?: boolean;
  /** The control, aligned to the right. */
  children?: React.ReactNode;
  "data-testid"?: string;
}

const LABEL_CLASS = "text-sm font-medium text-primary";

/** One setting: label and description on the left, its control on the right. */
export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  htmlFor,
  labelId,
  help,
  disabled,
  children,
  "data-testid": testId,
}) => (
  <div
    data-testid={testId}
    className={clsx("flex items-center justify-between gap-6 px-4 py-3", disabled && "opacity-60")}
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} id={labelId} className={LABEL_CLASS}>
            {label}
          </label>
        ) : (
          <span id={labelId} className={LABEL_CLASS}>
            {label}
          </span>
        )}
        {help}
      </div>
      {description && <p className="m-0 mt-0.5 text-xs text-secondary">{description}</p>}
    </div>
    {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
  </div>
);
