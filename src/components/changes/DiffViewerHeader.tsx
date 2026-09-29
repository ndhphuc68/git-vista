import React from "react";
import clsx from "clsx";
import { Layers, Space, Type } from "lucide-react";
import { useTranslation } from "../../i18n";
import { type FileDiffResult } from "../../ipc/bindings.generated";

export interface DiffViewerHeaderProps {
  diff: FileDiffResult;
  isStaged: boolean;
  showWordDiff: boolean;
  setShowWordDiff: (value: boolean) => void;
  diffIgnoreWhitespace: boolean;
  setDiffIgnoreWhitespace: (value: boolean) => void;
}

/** File name, staged badge, +/- totals and the whitespace/word-diff toggles. */
export const DiffViewerHeader: React.FC<DiffViewerHeaderProps> = ({
  diff,
  isStaged,
  showWordDiff,
  setShowWordDiff,
  diffIgnoreWhitespace,
  setDiffIgnoreWhitespace,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-window border-b border-border-subtle sticky top-0 z-10 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1 shrink">
        <span
          className={clsx(
            "inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold shrink-0",
            isStaged
              ? "bg-accent-subtle text-accent border border-accent"
              : "bg-surface text-secondary border border-border-subtle"
          )}
        >
          {isStaged ? t.diff.stagedBadge : t.diff.unstagedBadge}
        </span>
        <span
          className="font-mono text-xs font-semibold text-primary overflow-hidden text-ellipsis whitespace-nowrap"
          title={diff.file_path}
        >
          {diff.file_path}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="text-diff-add-text">+{diff.additions}</span>
          <span className="text-diff-remove-text">-{diff.deletions}</span>
        </div>
        <div className="flex items-center gap-1 text-secondary">
          <Layers size={13} />
          <span>
            {diff.hunks.length} {diff.hunks.length === 1 ? "hunk" : "hunks"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <button
            type="button"
            title={diffIgnoreWhitespace ? t.diff.ignoreWhitespaceActive : t.diff.ignoreWhitespace}
            aria-label={t.diff.ignoreWhitespace}
            onClick={() => setDiffIgnoreWhitespace(!diffIgnoreWhitespace)}
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
            onClick={() => setShowWordDiff(!showWordDiff)}
            className={clsx(
              "p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer",
              showWordDiff
                ? "bg-accent/15 text-accent border border-accent/40"
                : "bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary"
            )}
          >
            <Type size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
