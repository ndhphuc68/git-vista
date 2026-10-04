import React from "react";

export interface SettingsPageProps {
  title: string;
  description?: string;
  /** Rendered between the header and the sections, e.g. the scope selector. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

/** Title, description and body of one settings tab. */
export const SettingsPage: React.FC<SettingsPageProps> = ({
  title,
  description,
  toolbar,
  children,
}) => (
  <div className="space-y-6">
    <header className="space-y-1">
      <h3 className="m-0 text-lg font-semibold text-primary">{title}</h3>
      {description && <p className="m-0 text-xs text-secondary">{description}</p>}
    </header>
    {toolbar}
    {children}
  </div>
);
