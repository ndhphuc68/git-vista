import React from "react";
import clsx from "clsx";
import { type DiffLine } from "../../ipc/bindings.generated";
import { type WordDiffToken } from "../../utils/wordDiff";
import { DiffLineContent } from "./DiffLineContent";

export interface UnifiedDiffRowProps {
  line: DiffLine;
  tokens: WordDiffToken[] | undefined;
  showWordDiff: boolean;
  showLineNumbers: boolean;
}

/** One read-only unified diff line: old/new line numbers, sign and content. */
export const UnifiedDiffRow: React.FC<UnifiedDiffRowProps> = ({
  line,
  tokens,
  showWordDiff,
  showLineNumbers,
}) => {
  const isAdd = line.line_type === "add";
  const isDel = line.line_type === "delete";

  return (
    <div
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
      {showLineNumbers && (
        <div
          data-testid="diff-line-numbers"
          className="flex shrink-0 select-none border-r border-border-subtle/50 text-tertiary bg-window/40"
        >
          <span className="w-10 text-right pr-2 py-0.5 opacity-70">{line.old_lineno ?? ""}</span>
          <span className="w-10 text-right pr-2 py-0.5 opacity-70">{line.new_lineno ?? ""}</span>
        </div>
      )}

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
          tokens={tokens}
          showWordDiff={showWordDiff}
        />
      </span>
    </div>
  );
};
