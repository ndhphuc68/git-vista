import React from "react";
import clsx from "clsx";
import { formatExactDateTime } from "../../features/history";
import { BlameLineGutter } from "./BlameLineGutter";
import type { BlameLine } from "../../ipc/bindings.generated";

interface BlameLineRowProps {
  line: BlameLine;
  copiedSha: string | null;
  onCommitClick: (sha: string) => void;
  onCopySha: (sha: string, e: React.MouseEvent) => void;
}

/** One source line in BlameView, with its author/commit gutter, line number and content. */
export const BlameLineRow: React.FC<BlameLineRowProps> = ({
  line,
  copiedSha,
  onCommitClick,
  onCopySha,
}) => {
  const isHunk = line.is_hunk_start;
  const hasCommit = Boolean(line.commit_id);

  return (
    <div
      className={clsx(
        "flex items-stretch hover:bg-surface-hover/80 transition-colors group",
        isHunk ? "border-t border-border-subtle/40" : ""
      )}
    >
      {/* Blame Author & Commit Gutter (Fixed width) */}
      <div
        className="w-72 shrink-0 flex items-center gap-2 px-2.5 py-0.5 border-r border-border-subtle/60 bg-window/30 text-[11px] select-none"
        title={
          hasCommit
            ? `${line.summary}\n${line.author_name} <${line.author_email}>\n${formatExactDateTime(
                line.timestamp_sec
              )} (${line.commit_id})`
            : undefined
        }
      >
        {isHunk && hasCommit ? (
          <BlameLineGutter
            line={line}
            copiedSha={copiedSha}
            onCommitClick={onCommitClick}
            onCopySha={onCopySha}
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* Line number */}
      <div className="w-12 shrink-0 pr-2 py-0.5 text-right font-mono text-[11px] text-tertiary border-r border-border-subtle/50 select-none bg-window/10">
        {line.line_no}
      </div>

      {/* Line text */}
      <div className="flex-1 pl-3 pr-4 py-0.5 whitespace-pre font-mono text-xs text-primary leading-5 overflow-x-visible">
        {line.content}
      </div>
    </div>
  );
};
