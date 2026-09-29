import React from "react";
import { X, GitBranch, AlertTriangle } from "lucide-react";
import type { Translations } from "../../i18n/vi";

export interface InteractiveRebaseModalHeaderProps {
  t: Translations;
  titleId: string;
  baseCommitId: string;
  baseCommitSummary?: string;
  error: string | null;
  submitting: boolean;
  onClose: () => void;
}

export const InteractiveRebaseModalHeader: React.FC<InteractiveRebaseModalHeaderProps> = ({
  t,
  titleId,
  baseCommitId,
  baseCommitSummary,
  error,
  submitting,
  onClose,
}) => {
  return (
    <>
      {/* Header. Kept custom rather than using Modal.Header: it carries a
          subtitle and its close button is disabled while submitting. */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <GitBranch size={16} />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-semibold text-primary flex items-center gap-2">
              {t.modals.interactiveRebase.title}
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              {t.modals.interactiveRebase.subtitle.replace(
                "{base}",
                `${baseCommitId.slice(0, 7)}${baseCommitSummary ? ` (${baseCommitSummary})` : ""}`
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-30"
        >
          <X size={16} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-fade-in shrink-0">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1 whitespace-pre-wrap font-mono text-[11px]">{error}</div>
        </div>
      )}
    </>
  );
};
