import clsx from "clsx";
import { Space, Type, FileText, History } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useInspectorStore } from "../../../store/useInspectorStore";
import type { FileDiffResult } from "../../../ipc/bindings.generated";

interface FileDiffToolbarProps {
  activeFilePath: string;
  diff: FileDiffResult | undefined;
  commitId: string;
  diffIgnoreWhitespace: boolean;
  setDiffIgnoreWhitespace: (value: boolean) => void;
  showWordDiff: boolean;
  setShowWordDiff: (value: boolean) => void;
}

/** Toolbar above the diff hunks: file path/stats, whitespace/word-diff toggles, blame/history. */
export function FileDiffToolbar({
  activeFilePath,
  diff,
  commitId,
  diffIgnoreWhitespace,
  setDiffIgnoreWhitespace,
  showWordDiff,
  setShowWordDiff,
}: FileDiffToolbarProps) {
  const { t } = useTranslation();
  const { openInspector } = useInspectorStore();

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-window border-b border-border-subtle gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="font-mono text-xs font-semibold text-primary overflow-hidden text-ellipsis whitespace-nowrap"
          title={activeFilePath}
        >
          {activeFilePath}
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
          onClick={() => setDiffIgnoreWhitespace(!diffIgnoreWhitespace)}
          className={clsx(
            "p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer",
            diffIgnoreWhitespace
              ? "bg-accent/15 text-link border border-accent/40"
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
              ? "bg-accent/15 text-link border border-accent/40"
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
          onClick={() => openInspector(activeFilePath, "blame", commitId)}
          className="p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary"
        >
          <FileText size={13} />
        </button>

        <button
          type="button"
          title={t.inspector.viewHistory}
          aria-label={t.inspector.viewHistory}
          onClick={() => openInspector(activeFilePath, "history")}
          className="p-1.5 rounded text-xs flex items-center justify-center transition-colors cursor-pointer bg-surface text-secondary border border-border-subtle hover:bg-surface-hover hover:text-primary"
        >
          <History size={13} />
        </button>
      </div>
    </div>
  );
}
