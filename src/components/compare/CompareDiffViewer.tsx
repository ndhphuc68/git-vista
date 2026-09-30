import React, { useState } from "react";
import clsx from "clsx";
import { FileCode } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useInspectorStore } from "../../store/useInspectorStore";
import { pairHunkLines } from "../../utils/wordDiff";
import { type DiffHunk, type CompareMode, type CompareFileItem } from "../../ipc/bindings.generated";
import { DiffLineContent } from "../diff/DiffLineContent";
import { useCompareFileDiff } from "../../features/compare";
import { CompareDiffToolbar } from "./CompareDiffToolbar";
import { diffLineKey, hunkKey } from "../../shared/utils/listKeys";

export interface CompareDiffViewerProps {
  repoPath: string;
  baseRev: string;
  targetRev: string;
  file: CompareFileItem | null;
  mode: CompareMode;
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
              key={diffLineKey(line)}
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

export const CompareDiffViewer: React.FC<CompareDiffViewerProps> = ({
  repoPath,
  baseRev,
  targetRev,
  file,
  mode,
}) => {
  const { t } = useTranslation();
  const [showWordDiff, setShowWordDiff] = useState(true);
  const { diffIgnoreWhitespace, setDiffIgnoreWhitespace } = useSettingsStore();
  const { openInspector } = useInspectorStore();

  const filePath = file?.path ?? "";

  const { data: diff, isLoading } = useCompareFileDiff(repoPath, {
    baseRev,
    targetRev,
    filePath,
    mode,
    ignoreWhitespace: diffIgnoreWhitespace,
  });

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-tertiary text-xs gap-2 select-none">
        <FileCode size={28} className="opacity-30" />
        <span>{t.compare.selectFileToViewDiff}</span>
      </div>
    );
  }

  if (file.is_binary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-tertiary text-xs gap-2 select-none">
        <FileCode size={28} className="opacity-30" />
        <span>Tập tin nhị phân (Binary). Không thể hiển thị diff văn bản.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-secondary text-xs gap-2">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>{t.diff.readingDiff}</span>
      </div>
    );
  }

  const toolbar = (
    <CompareDiffToolbar
      file={file}
      diff={diff}
      diffIgnoreWhitespace={diffIgnoreWhitespace}
      onToggleIgnoreWhitespace={() => setDiffIgnoreWhitespace(!diffIgnoreWhitespace)}
      showWordDiff={showWordDiff}
      onToggleWordDiff={() => setShowWordDiff(!showWordDiff)}
      onViewBlame={() => openInspector(file.path, "blame")}
      onViewHistory={() => openInspector(file.path, "history")}
    />
  );

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="flex flex-col h-full font-mono text-xs overflow-hidden bg-surface">
        {toolbar}
        <div className="flex-1 flex items-center justify-center p-8 text-tertiary text-xs text-center">
          {t.diff.noTextChanges}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden bg-surface">
      {toolbar}
      <div className="flex-1 overflow-y-auto">
        {diff.hunks.map((hunk) => (
          <FileDiffHunk key={hunkKey(hunk)} hunk={hunk} showWordDiff={showWordDiff} />
        ))}
      </div>
    </div>
  );
};
