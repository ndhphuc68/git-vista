import { GitCommit, Check, Copy, X } from "lucide-react";
import { useTranslation } from "../../../i18n";
import type { CommitDetails } from "../api/useCommitDetails";

interface CommitDetailPanelHeaderProps {
  details: CommitDetails;
  copiedSha: boolean;
  handleCopySha: (sha: string) => void;
  handleClose: () => void;
}

/** Top bar of the commit detail panel: title, SHA copy, additions/deletions, close button. */
export function CommitDetailPanelHeader({
  details,
  copiedSha,
  handleCopySha,
  handleClose,
}: CommitDetailPanelHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="h-13 px-4 border-b border-border-subtle bg-window flex items-center justify-between shrink-0 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <span className="p-1.5 rounded-md bg-accent/10 text-accent shrink-0 ring-1 ring-accent/20">
          <GitCommit size={17} />
        </span>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-bold text-sm text-primary tracking-tight">
            {t.diff.commitDetailsTitle}
          </span>
          <button
            type="button"
            onClick={() => handleCopySha(details.id)}
            className="flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded-md bg-surface border border-border-subtle hover:bg-surface-hover text-accent font-semibold cursor-pointer transition-colors shadow-2xs"
            title={t.diff.copyShaTooltip}
          >
            <span>{details.id.substring(0, 7)}</span>
            {copiedSha ? <Check size={12} className="text-diff-add-text" /> : <Copy size={12} />}
          </button>
          <span className="text-tertiary text-xs">|</span>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-diff-add-bg text-diff-add-text border border-diff-add-border">
              {`+${details.total_additions}`}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-diff-remove-bg text-diff-remove-text border border-diff-remove-border">
              {`-${details.total_deletions}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleClose}
          aria-label={t.diff.closeDetailAria}
          title={t.diff.closeDetailTitle}
          className="px-2.5 py-1 rounded-md bg-surface hover:bg-surface-hover active:bg-surface-active text-secondary hover:text-primary text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-border-subtle shadow-2xs"
        >
          <span>Đóng</span>
          <kbd className="text-[10px] font-mono text-tertiary bg-window px-1 rounded border border-border-subtle">
            Esc
          </kbd>
          <X size={13} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}
