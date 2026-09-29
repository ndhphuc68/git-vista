import React from "react";
import clsx from "clsx";
import { Space, Type, FileText, History } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareFileItem, FileDiffResult } from "../../ipc/bindings.generated";

interface CompareDiffToolbarProps {
  file: CompareFileItem;
  diff?: FileDiffResult;
  diffIgnoreWhitespace: boolean;
  onToggleIgnoreWhitespace: () => void;
  showWordDiff: boolean;
  onToggleWordDiff: () => void;
  onViewBlame: () => void;
  onViewHistory: () => void;
}

/** Toolbar above the compare diff: file path/stats, whitespace/word-diff toggles, blame/history shortcuts. */
export const CompareDiffToolbar: React.FC<CompareDiffToolbarProps> = ({
  file,
  diff,
  diffIgnoreWhitespace,
  onToggleIgnoreWhitespace,
  showWordDiff,
  onToggleWordDiff,
  onViewBlame,
  onViewHistory,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-window border-b border-border-subtle gap-2 shrink-0 select-none">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="font-mono text-xs font-semibold text-primary overflow-hidden text-ellipsis whitespace-nowrap"
          title={file.path}
        >
          {file.path}
        </span>
        {diff && (
          <div className="flex items-center gap-1 font-mono text-xs shrink-0">
            <span className="text-diff-add-text font-semibold">+{diff.additions}</span>
            <span className="text-diff-remove-text font-semibold">-{diff.deletions}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          title={diffIgnoreWhitespace ? t.diff.ignoreWhitespaceActive : t.diff.ignoreWhitespace}
          aria-label={t.diff.ignoreWhitespace}
          onClick={onToggleIgnoreWhitespace}
          className={clsx(
            "p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer",
            diffIgnoreWhitespace
              ? "bg-accent/15 text-accent border border-accent/40"
              : "bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary"
          )}
        >
          <Space size={13} />
        </button>
        <button
          type="button"
          title={showWordDiff ? t.diff.wordDiffActive : t.diff.wordDiff}
          aria-label={t.diff.wordDiff}
          onClick={onToggleWordDiff}
          className={clsx(
            "p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer",
            showWordDiff
              ? "bg-accent/15 text-accent border border-accent/40"
              : "bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary"
          )}
        >
          <Type size={13} />
        </button>

        <div className="w-[1px] h-3.5 bg-border-subtle mx-0.5" />

        <button
          type="button"
          title={t.inspector.viewBlame}
          aria-label={t.inspector.viewBlame}
          onClick={onViewBlame}
          className="p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary"
        >
          <FileText size={13} />
        </button>

        <button
          type="button"
          title={t.inspector.viewHistory}
          aria-label={t.inspector.viewHistory}
          onClick={onViewHistory}
          className="p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary"
        >
          <History size={13} />
        </button>
      </div>
    </div>
  );
};
