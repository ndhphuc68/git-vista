import React from "react";
import clsx from "clsx";
import { type DiffLine } from "../../ipc/bindings.generated";
import { DiffLineContent } from "../diff/DiffLineContent";
import { type WordDiffToken } from "../../utils/wordDiff";
import { DiffLineGutter } from "./DiffLineGutter";
import { DiffLineStageButton } from "./DiffLineStageButton";

export interface DiffHunkLineProps {
  line: DiffLine;
  hIdx: number;
  lIdx: number;
  isStaged: boolean;
  showWordDiff: boolean;
  tokens: WordDiffToken[] | undefined;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

/** One line of a diff hunk: gutter, content, and its line-level staging button. */
export const DiffHunkLine: React.FC<DiffHunkLineProps> = ({
  line,
  hIdx,
  lIdx,
  isStaged,
  showWordDiff,
  tokens,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onStageLines,
  onUnstageLines,
}) => {
  const isAdd = line.line_type === "add";
  const isDel = line.line_type === "delete";
  const isModifiedLine = isAdd || isDel;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
      <DiffLineGutter
        oldLineno={line.old_lineno}
        newLineno={line.new_lineno}
        isAdd={isAdd}
        isDel={isDel}
        isModifiedLine={isModifiedLine}
      />

      {/* Line Content */}
      <span className="flex-1 min-w-0 pr-4">
        <DiffLineContent
          content={line.content}
          lineType={line.line_type}
          tokens={tokens}
          showWordDiff={showWordDiff}
        />
      </span>

      {/* Line-level Staging Action Button */}
      {isModifiedLine && (
        <DiffLineStageButton
          hIdx={hIdx}
          lIdx={lIdx}
          isStaged={isStaged}
          isHovered={isHovered}
          onStageLines={onStageLines}
          onUnstageLines={onUnstageLines}
        />
      )}
    </div>
  );
};
