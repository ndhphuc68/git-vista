import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface GitHubTokenStatusAlertsProps {
  errorMessage: string | null;
  successMessage: string | null;
}

/** Error/success alert banners shown below the GitHub token action buttons. */
export const GitHubTokenStatusAlerts: React.FC<GitHubTokenStatusAlertsProps> = ({
  errorMessage,
  successMessage,
}) => (
  <>
    {errorMessage && (
      <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs flex items-center gap-2 mt-2">
        <AlertCircle size={14} className="shrink-0" />
        <span>{errorMessage}</span>
      </div>
    )}

    {successMessage && (
      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs flex items-center gap-2 mt-2">
        <CheckCircle2 size={14} className="shrink-0" />
        <span>{successMessage}</span>
      </div>
    )}
  </>
);
