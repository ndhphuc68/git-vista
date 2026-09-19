import React, { useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { Space, Type, FileText, History } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useInspectorStore } from "../../store/useInspectorStore";
import { pairHunkLines } from "../../utils/wordDiff";
import { type DiffHunk } from "../../ipc/bindings.generated";
import { DiffLineContent } from "./DiffLineContent";
import { qk } from "../../domain/queryKeys";

interface FileDiffViewerProps {
  repoPath: string;
  commitId: string;
  filePath: string;
}

interface FileDiffHunkProps {
  hunk: DiffHunk;
  showWordDiff: boolean;
}

const FileDiffHunk: React.FC<FileDiffHunkProps> = ({ hunk, showWordDiff }) => {
  const tokenMap = React.useMemo(() => pairHunkLines(hunk.lines), [hunk.lines]);

  return (
    <div className="border-b last:border-b-0 border-border-subtle">
      {/* Hunk Header */}
      <div className="bg-window px-3 py-1 text-[11px] font-semibold text-secondary border-b border-border-subtle flex items-center gap-2 select-none">
        <span className="text-accent font-mono">{hunk.header}</span>
      </div>

      {/* Hunk Lines */}
      <div className="divide-y divide-border-subtle/30">
        {hunk.lines.map((line, lIdx) => {
          const isAdd = line.line_type === "add";
          const isDel = line.line_type === "delete";

          return (
            <div
              key={lIdx}
              className={clsx(
                "flex leading-5 whitespace-pre font-mono hover:brightness-95 dark:hover:brightness-110 transition-colors",
                isAdd
                  ? "bg-diff-add-bg text-diff-add-text"
                  : isDel
                    ? "bg-diff-remove-bg text-diff-remove-text"
                    : "bg-transparent text-primary"
              )}
            >
              {/* Line numbers gutter */}
              <div className="flex shrink-0 select-none border-r border-border-subtle/50 text-tertiary bg-window/40">
                <span className="w-10 text-right pr-2 py-0.5 opacity-70">
                  {line.old_lineno ?? ""}
                </span>
                <span className="w-10 text-right pr-2 py-0.5 opacity-70">
                  {line.new_lineno ?? ""}
                </span>
              </div>

              {/* Sign (+ / - / space) */}
              <span
                className={clsx(
                  "w-6 select-none text-center py-0.5 shrink-0 font-bold",
                  isAdd ? "text-diff-add-text" : isDel ? "text-diff-remove-text" : "text-tertiary"
                )}
              >
                {isAdd ? "+" : isDel ? "-" : " "}
              </span>

              {/* Code line content */}
              <span className="flex-1 min-w-0 py-0.5 pr-3 overflow-x-visible">
                <DiffLineContent
                  content={line.content}
                  lineType={line.line_type}
                  tokens={tokenMap.get(lIdx)}
                  showWordDiff={showWordDiff}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FileDiffViewer: React.FC<FileDiffViewerProps> = ({ repoPath, commitId, filePath }) => {
  const { t } = useTranslation();
  const [showWordDiff, setShowWordDiff] = useState(true);
  const { diffIgnoreWhitespace, setDiffIgnoreWhitespace } = useSettingsStore();
  const { openInspector } = useInspectorStore();

  const { data: diff, isLoading } = useQuery({
    queryKey: qk.fileDiff(repoPath, commitId, filePath, diffIgnoreWhitespace),
    queryFn: () =>
      invokeCommand.getCommitFileDiff(repoPath, commitId, filePath, diffIgnoreWhitespace),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-secondary text-xs flex items-center justify-center gap-2 h-48">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>{t.diff.readingDiff}</span>
      </div>
    );
  }

  const activeFilePath = diff?.file_path || filePath;

  const renderToolbar = () => (
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

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="flex flex-col font-mono text-xs overflow-x-auto rounded-md border border-border-subtle bg-surface shadow-2xs">
        {renderToolbar()}
        <div className="p-8 text-tertiary text-xs text-center">{t.diff.noTextChanges}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-mono text-xs overflow-x-auto rounded-md border border-border-subtle bg-surface shadow-2xs">
      {renderToolbar()}
      {diff.hunks.map((hunk, hIdx) => (
        <FileDiffHunk key={hIdx} hunk={hunk} showWordDiff={showWordDiff} />
      ))}
    </div>
  );
};
