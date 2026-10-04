import React from "react";

export interface SettingsSectionProps {
  title: string;
  /** Short note shown at the right of the section title. */
  hint?: string;
  /** Usually a `HelpTooltip`, shown next to the title. */
  help?: React.ReactNode;
  children: React.ReactNode;
}

/** Group label plus a rounded card whose rows are separated by dividers. */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  hint,
  help,
  children,
}) => (
  <section aria-label={title} className="space-y-2">
    <div className="flex items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-1.5">
        <h4 className="m-0 text-xs font-semibold uppercase tracking-wide text-tertiary">{title}</h4>
        {help}
      </div>
      {hint && <span className="text-xs text-tertiary">{hint}</span>}
    </div>
    <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-header/30">
      {children}
    </div>
  </section>
);
