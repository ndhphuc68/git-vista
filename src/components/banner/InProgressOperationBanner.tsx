import React, { useState } from "react";
import { AlertTriangle, Play, XCircle, FileText } from "lucide-react";
import { RepoStateInfo } from "../../ipc/bindings";
import { useTranslation } from "../../i18n";

export interface InProgressOperationBannerProps {
  repoState: RepoStateInfo | null | undefined;
  onAbort: (operation: string) => Promise<void>;
  onContinue: (operation: string) => Promise<void>;
  onNavigateToChanges: () => void;
}

export const InProgressOperationBanner: React.FC<InProgressOperationBannerProps> = ({
  repoState,
  onAbort,
  onContinue,
  onNavigateToChanges,
}) => {
  const { t } = useTranslation();
  const [isAborting, setIsAborting] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!repoState || !repoState.is_in_progress) {
    return null;
  }

  const opLabel = (() => {
    switch (repoState.state.toLowerCase()) {
      case "merge":
        return "Merge";
      case "rebase":
        return "Rebase";
      case "cherry_pick":
        return "Cherry-Pick";
      case "revert":
        return "Revert";
      default:
        return repoState.state.toUpperCase();
    }
  })();

  const handleAbort = async () => {
    setIsAborting(true);
    setActionError(null);
    try {
      await onAbort(repoState.state);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(t.banner.abortError.replace("{msg}", msg));
    } finally {
      setIsAborting(false);
    }
  };

  const handleContinue = async () => {
    if (repoState.conflict_count > 0) return;
    setIsContinuing(true);
    setActionError(null);
    try {
      await onContinue(repoState.state);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(t.banner.continueError.replace("{msg}", msg));
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <div
      role="alert"
      className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-40 transition-colors"
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 font-semibold text-amber-300">
          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
          <span>{t.banner.inProgress.replace("{operation}", opLabel)}</span>
          {repoState.target_name && (
            <span className="font-normal text-amber-200/80">
              (nhánh <strong className="font-semibold text-amber-100">{repoState.target_name}</strong>)
            </span>
          )}
        </div>

        <span className="text-amber-400/50">•</span>

        <span
          className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
            repoState.conflict_count > 0
              ? "bg-diff-remove-bg text-diff-remove-text border border-diff-remove-text/30 font-semibold"
              : "bg-amber-400/20 text-amber-200"
          }`}
        >
          {repoState.conflict_count > 0
            ? t.banner.conflictsCount.replace("{count}", String(repoState.conflict_count))
            : t.banner.noConflicts}
        </span>

        {actionError && (
          <span className="text-diff-remove-text text-[11px] font-mono ml-2">
            {actionError}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onNavigateToChanges}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-sm font-medium cursor-pointer transition-colors"
        >
          <FileText size={12} />
          <span>{t.banner.viewChanges}</span>
        </button>

        <button
          type="button"
          onClick={handleAbort}
          disabled={isAborting || isContinuing}
          className="flex items-center gap-1 px-2.5 py-1 bg-diff-remove-bg hover:opacity-90 text-diff-remove-text border border-diff-remove-text/40 rounded-sm font-semibold cursor-pointer transition-all disabled:opacity-50"
        >
          <XCircle size={12} />
          <span>{isAborting ? t.banner.aborting : t.banner.abortOp}</span>
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={repoState.conflict_count > 0 || isAborting || isContinuing}
          title={
            repoState.conflict_count > 0
              ? t.banner.continueTooltipDisabled
              : t.banner.continueTooltip
          }
          className="flex items-center gap-1 px-2.5 py-1 bg-accent hover:opacity-90 text-white border-none rounded-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={12} />
          <span>{isContinuing ? t.banner.continuing : t.banner.continueOp}</span>
        </button>
      </div>
    </div>
  );
};
