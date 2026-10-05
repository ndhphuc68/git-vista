import React, { useMemo } from "react";
import { type DiffHunk } from "../../ipc/bindings.generated";
import { type DiffViewMode } from "../../store/useSettingsStore";
import { pairHunkLines } from "../../utils/wordDiff";
import { diffLineKey } from "../../shared/utils/listKeys";
import { UnifiedDiffRow } from "./UnifiedDiffRow";
import { SplitDiffRow } from "./SplitDiffRow";
import { pairSplitRows, type SplitRow } from "./splitRows";

export interface ReadOnlyDiffHunkProps {
  hunk: DiffHunk;
  showWordDiff: boolean;
  showLineNumbers: boolean;
  viewMode: DiffViewMode;
}

function splitRowKey(row: SplitRow): string {
  const left = row.left ? diffLineKey(row.left.line) : "-";
  const right = row.right ? diffLineKey(row.right.line) : "-";
  return `${left}|${right}`;
}

/** A read-only diff hunk (history and compare viewers): header plus unified or split lines. */
export const ReadOnlyDiffHunk: React.FC<ReadOnlyDiffHunkProps> = ({
  hunk,
  showWordDiff,
  showLineNumbers,
  viewMode,
}) => {
  const tokenMap = useMemo(() => pairHunkLines(hunk.lines), [hunk.lines]);
  const splitRows = useMemo(
    () => (viewMode === "split" ? pairSplitRows(hunk.lines) : []),
    [hunk.lines, viewMode]
  );

  return (
    <div className="border-b last:border-b-0 border-border-subtle">
      {/* Hunk Header */}
      <div className="bg-window px-3 py-1 text-[11px] font-semibold text-secondary border-b border-border-subtle flex items-center gap-2 select-none">
        <span className="text-accent font-mono">{hunk.header}</span>
      </div>

      {/* Hunk Lines */}
      <div className="divide-y divide-border-subtle/30">
        {viewMode === "split"
          ? splitRows.map((row) => (
              <SplitDiffRow
                key={splitRowKey(row)}
                row={row}
                tokenMap={tokenMap}
                showWordDiff={showWordDiff}
                showLineNumbers={showLineNumbers}
              />
            ))
          : hunk.lines.map((line, lIdx) => (
              <UnifiedDiffRow
                key={diffLineKey(line)}
                line={line}
                tokens={tokenMap.get(lIdx)}
                showWordDiff={showWordDiff}
                showLineNumbers={showLineNumbers}
              />
            ))}
      </div>
    </div>
  );
};
