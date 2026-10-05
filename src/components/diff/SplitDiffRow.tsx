import React from "react";
import clsx from "clsx";
import { type WordDiffToken } from "../../utils/wordDiff";
import { DiffLineContent } from "./DiffLineContent";
import { type SplitRow, type SplitSide } from "./splitRows";

interface SplitDiffCellProps {
  side: SplitSide | null;
  isOld: boolean;
  tokenMap: Map<number, WordDiffToken[]>;
  showWordDiff: boolean;
  showLineNumbers: boolean;
}

/** One half of a split row; an empty half fills the gap left by an unpaired line. */
const SplitDiffCell: React.FC<SplitDiffCellProps> = ({
  side,
  isOld,
  tokenMap,
  showWordDiff,
  showLineNumbers,
}) => {
  if (!side) return <div className="flex-1 min-w-0 bg-window/40" />;
  const { line, index } = side;
  const isAdd = line.line_type === "add";
  const isDel = line.line_type === "delete";

  return (
    <div
      className={clsx(
        "flex flex-1 min-w-0 overflow-x-auto",
        isAdd
          ? "bg-diff-add-bg text-diff-add-text"
          : isDel
            ? "bg-diff-remove-bg text-diff-remove-text"
            : "text-primary"
      )}
    >
      {showLineNumbers && (
        <span
          data-testid="diff-line-numbers"
          className="w-10 shrink-0 select-none text-right pr-2 py-0.5 opacity-70 text-tertiary bg-window/40 border-r border-border-subtle/50"
        >
          {(isOld ? line.old_lineno : line.new_lineno) ?? ""}
        </span>
      )}
      <span className="w-6 shrink-0 select-none text-center py-0.5 font-bold">
        {isAdd ? "+" : isDel ? "-" : " "}
      </span>
      <span className="flex-1 py-0.5 pr-3 whitespace-pre">
        <DiffLineContent
          content={line.content}
          lineType={line.line_type}
          tokens={tokenMap.get(index)}
          showWordDiff={showWordDiff}
        />
      </span>
    </div>
  );
};

export interface SplitDiffRowProps {
  row: SplitRow;
  tokenMap: Map<number, WordDiffToken[]>;
  showWordDiff: boolean;
  showLineNumbers: boolean;
}

/** A side-by-side diff row: old file on the left, new file on the right. */
export const SplitDiffRow: React.FC<SplitDiffRowProps> = ({
  row,
  tokenMap,
  showWordDiff,
  showLineNumbers,
}) => (
  <div data-testid="split-diff-row" className="flex leading-5 font-mono">
    <SplitDiffCell
      side={row.left}
      isOld
      tokenMap={tokenMap}
      showWordDiff={showWordDiff}
      showLineNumbers={showLineNumbers}
    />
    <div className="w-px shrink-0 bg-border-subtle" />
    <SplitDiffCell
      side={row.right}
      isOld={false}
      tokenMap={tokenMap}
      showWordDiff={showWordDiff}
      showLineNumbers={showLineNumbers}
    />
  </div>
);
