import React, { useMemo } from "react";
import { type DiffHunk } from "../../ipc/bindings.generated";
import { pairHunkLines } from "../../utils/wordDiff";
import { diffLineKey } from "../../shared/utils/listKeys";
import { UnifiedDiffRow } from "./UnifiedDiffRow";

export interface ReadOnlyDiffHunkProps {
  hunk: DiffHunk;
  showWordDiff: boolean;
}

/** A read-only diff hunk (history and compare viewers): header plus its lines. */
export const ReadOnlyDiffHunk: React.FC<ReadOnlyDiffHunkProps> = ({ hunk, showWordDiff }) => {
  const tokenMap = useMemo(() => pairHunkLines(hunk.lines), [hunk.lines]);

  return (
    <div className="border-b last:border-b-0 border-border-subtle">
      {/* Hunk Header */}
      <div className="bg-window px-3 py-1 text-[11px] font-semibold text-secondary border-b border-border-subtle flex items-center gap-2 select-none">
        <span className="text-accent font-mono">{hunk.header}</span>
      </div>

      {/* Hunk Lines */}
      <div className="divide-y divide-border-subtle/30">
        {hunk.lines.map((line, lIdx) => (
          <UnifiedDiffRow
            key={diffLineKey(line)}
            line={line}
            tokens={tokenMap.get(lIdx)}
            showWordDiff={showWordDiff}
          />
        ))}
      </div>
    </div>
  );
};
