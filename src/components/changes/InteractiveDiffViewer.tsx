import React, { useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { Plus, Minus, FileCode, AlertTriangle, Layers, Space, Type } from "lucide-react";
import { invokeCommand } from "../../ipc/client";
import { useTranslation } from "../../i18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import { pairHunkLines } from "../../utils/wordDiff";
import { type DiffHunk } from "../../ipc/bindings";
import { DiffLineContent } from "../diff/DiffLineContent";

export interface InteractiveDiffViewerProps {
  repoPath: string;
  filePath: string;
  isStaged: boolean;
  onStageHunk: (hunkIndex: number) => void;
  onUnstageHunk: (hunkIndex: number) => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

interface InteractiveHunkProps {
  hunk: DiffHunk;
  hIdx: number;
  isStaged: boolean;
  showWordDiff: boolean;
  hoveredLineKey: string | null;
  setHoveredLineKey: (key: string | null) => void;
  onStageHunk: (hunkIndex: number) => void;
  onUnstageHunk: (hunkIndex: number) => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
  t: ReturnType<typeof useTranslation>["t"];
}

const InteractiveHunk: React.FC<InteractiveHunkProps> = ({
  hunk,
  hIdx,
  isStaged,
  showWordDiff,
  hoveredLineKey,
  setHoveredLineKey,
  onStageHunk,
  onUnstageHunk,
  onStageLines,
  onUnstageLines,
  t,
}) => {
  const tokenMap = React.useMemo(() => pairHunkLines(hunk.lines), [hunk.lines]);

  return (
    <div className="mb-4">
      {/* Hunk Header */}
      <div className="flex items-center justify-between bg-accent-subtle text-accent px-3 py-1 text-[11px] font-semibold border-y border-border-subtle">
        <span>{hunk.header}</span>

        {isStaged ? (
          <button
            type="button"
            data-testid={`unstage-hunk-${hIdx}`}
            onClick={() => onUnstageHunk(hIdx)}
            className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border-subtle rounded-sm text-primary text-xs font-medium cursor-pointer hover:bg-surface-hover transition-colors"
            title={t.diff.unstageHunk}
          >
            <Minus size={11} />
            <span>{t.diff.unstageHunk}</span>
          </button>
        ) : (
          <button
            type="button"
            data-testid={`stage-hunk-${hIdx}`}
            onClick={() => onStageHunk(hIdx)}
            className="flex items-center gap-1 px-2 py-0.5 bg-accent border border-accent rounded-sm text-accent-contrast text-xs font-semibold cursor-pointer hover:bg-accent-hover transition-colors"
            title={t.diff.stageHunk}
          >
            <Plus size={11} />
            <span>{t.diff.stageHunk}</span>
          </button>
        )}
      </div>

      {/* Hunk Lines */}
      {hunk.lines.map((line, lIdx) => {
        const isAdd = line.line_type === "add";
        const isDel = line.line_type === "delete";
        const isModifiedLine = isAdd || isDel;
        const lineKey = `${hIdx}-${lIdx}`;
        const isHovered = hoveredLineKey === lineKey;

        return (
          <div
            key={lineKey}
            onMouseEnter={() => setHoveredLineKey(lineKey)}
            onMouseLeave={() => setHoveredLineKey(null)}
            className={clsx(
              "flex items-center py-px leading-5 whitespace-pre min-w-max w-full",
              isAdd
                ? "bg-diff-add-bg text-diff-add-text"
                : isDel
                  ? "bg-diff-remove-bg text-diff-remove-text"
                  : "bg-transparent text-primary"
            )}
          >
            {/* Sticky Line Number Gutter */}
            <div
              className={clsx(
                "flex items-center sticky left-0 z-2 shrink-0",
                isAdd ? "bg-diff-add-bg" : isDel ? "bg-diff-remove-bg" : "bg-surface"
              )}
            >
              {/* Old Line Number */}
              <span className="w-11 text-tertiary select-none text-right pr-2 shrink-0">
                {line.old_lineno ?? ""}
              </span>

              {/* New Line Number */}
              <span className="w-11 text-tertiary select-none text-right pr-2 shrink-0">
                {line.new_lineno ?? ""}
              </span>

              {/* Origin Sign (+, -, ' ') */}
              <span
                className={clsx(
                  "w-5 select-none text-center shrink-0",
                  isModifiedLine ? "font-bold" : "font-normal"
                )}
              >
                {isAdd ? "+" : isDel ? "-" : " "}
              </span>
            </div>

            {/* Line Content */}
            <span className="flex-1 min-w-0 pr-4">
              <DiffLineContent
                content={line.content}
                lineType={line.line_type}
                tokens={tokenMap.get(lIdx)}
                showWordDiff={showWordDiff}
              />
            </span>

            {/* Line-level Staging Action Button */}
            {isModifiedLine && (
              <div
                className={clsx(
                  "px-2 shrink-0 transition-opacity duration-150 ease-macos",
                  isHovered ? "opacity-100" : "opacity-40"
                )}
              >
                {isStaged ? (
                  <button
                    type="button"
                    data-testid={`unstage-line-${hIdx}-${lIdx}`}
                    onClick={() => onUnstageLines(hIdx, [lIdx])}
                    className="inline-flex items-center gap-0.5 px-1.5 py-px bg-surface border border-border-subtle rounded-sm text-secondary text-[10px] cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors"
                    title={t.diff.unstageSelectedLines}
                  >
                    <Minus size={10} />
                    <span>Line</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid={`stage-line-${hIdx}-${lIdx}`}
                    onClick={() => onStageLines(hIdx, [lIdx])}
                    className="inline-flex items-center gap-0.5 px-1.5 py-px bg-accent border border-accent rounded-sm text-accent-contrast text-[10px] cursor-pointer hover:bg-accent-hover transition-colors"
                    title={t.diff.stageSelectedLines}
                  >
                    <Plus size={10} />
                    <span>Line</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const InteractiveDiffViewer: React.FC<InteractiveDiffViewerProps> = ({
  repoPath,
  filePath,
  isStaged,
  onStageHunk,
  onUnstageHunk,
  onStageLines,
  onUnstageLines,
}) => {
  const { t } = useTranslation();
  const [hoveredLineKey, setHoveredLineKey] = useState<string | null>(null);
  const [showWordDiff, setShowWordDiff] = useState(true);
  const { diffIgnoreWhitespace, setDiffIgnoreWhitespace } = useSettingsStore();

  const {
    data: diff,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workingFileDiff", repoPath, filePath, isStaged, diffIgnoreWhitespace],
    queryFn: () =>
      invokeCommand.getWorkingFileDiff(repoPath, filePath, isStaged, diffIgnoreWhitespace),
    enabled: Boolean(repoPath && filePath),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-secondary text-xs">
        {t.diff.readingDiff}
      </div>
    );
  }

  if (isError || !diff) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-tertiary text-xs">
        <AlertTriangle size={18} className="text-diff-remove-text" />
        <span>{t.diff.diffError}</span>
      </div>
    );
  }

  const isBinary = diff.status?.toLowerCase() === "binary";

  if (isBinary) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-secondary text-xs">
        <FileCode size={24} className="text-tertiary" />
        <span>{t.diff.binaryFile}</span>
      </div>
    );
  }

  const totalAdds = diff.additions;
  const totalDels = diff.deletions;

  const renderHeader = () => (
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
          <span className="text-diff-add-text">+{totalAdds}</span>
          <span className="text-diff-remove-text">-{totalDels}</span>
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

  if (diff.hunks.length === 0) {
    return (
      <div className="flex flex-col h-full w-full bg-surface overflow-auto">
        {renderHeader()}
        <div className="flex items-center justify-center flex-1 text-tertiary text-xs p-8">
          {t.diff.noDiffContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-auto">
      {/* File Diff Header */}
      {renderHeader()}

      {/* Hunks list */}
      <div className="flex flex-col font-mono text-xs overflow-x-auto">
        {diff.hunks.map((hunk, hIdx) => (
          <InteractiveHunk
            key={`hunk-${hIdx}`}
            hunk={hunk}
            hIdx={hIdx}
            isStaged={isStaged}
            showWordDiff={showWordDiff}
            hoveredLineKey={hoveredLineKey}
            setHoveredLineKey={setHoveredLineKey}
            onStageHunk={onStageHunk}
            onUnstageHunk={onUnstageHunk}
            onStageLines={onStageLines}
            onUnstageLines={onUnstageLines}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};
