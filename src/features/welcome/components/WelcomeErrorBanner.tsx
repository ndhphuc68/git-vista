import React from "react";
import { AlertCircle } from "lucide-react";

export interface WelcomeErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

/**
 * Dismissible error banner shown on `WelcomeScreen` when an open/clone
 * operation fails. Extracted from the component body, keeping the same
 * markup verbatim.
 */
export const WelcomeErrorBanner: React.FC<WelcomeErrorBannerProps> = ({ error, onDismiss }) => {
  return (
    <div
      role="alert"
      className="px-4 py-3 bg-diff-remove-bg text-diff-remove-text rounded-xl text-sm border border-diff-remove-border flex items-center gap-2.5 shadow-xs"
    >
      <AlertCircle size={18} className="shrink-0 text-diff-remove-text" />
      <span className="flex-1 text-xs sm:text-sm leading-relaxed">{error}</span>
      <button
        onClick={onDismiss}
        aria-label="Close notice"
        className="bg-transparent border-0 cursor-pointer text-diff-remove-text hover:opacity-75 font-bold p-1 rounded"
      >
        ✕
      </button>
    </div>
  );
};
