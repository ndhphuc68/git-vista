import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "../../i18n";
import { pairHunkLines } from "../../utils/wordDiff";
import { type DiffHunk } from "../../ipc/bindings.generated";
import { DiffHunkLine } from "./DiffHunkLine";

export interface InteractiveHunkProps {
  hunk: DiffHunk;
  hIdx: number;
  isStaged: boolean;
  showWordDiff: boolean;
  onStageHunk: (hunkIndex: number) => void;
  onUnstageHunk: (hunkIndex: number) => void;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

/** A single diff hunk: its stage/unstage header and its lines. */
export const InteractiveHunk: React.FC<InteractiveHunkProps> = ({
  hunk,
  hIdx,
  isStaged,
  showWordDiff,
  onStageHunk,
  onUnstageHunk,
  onStageLines,
  onUnstageLines,
}) => {
  const { t } = useTranslation();
  const [hoveredLineKey, setHoveredLineKey] = useState<string | null>(null);
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
        const lineKey = `${hIdx}-${lIdx}`;

        return (
          <DiffHunkLine
            key={lineKey}
            line={line}
            hIdx={hIdx}
            lIdx={lIdx}
            isStaged={isStaged}
            showWordDiff={showWordDiff}
            tokens={tokenMap.get(lIdx)}
            isHovered={hoveredLineKey === lineKey}
            onMouseEnter={() => setHoveredLineKey(lineKey)}
            onMouseLeave={() => setHoveredLineKey(null)}
            onStageLines={onStageLines}
            onUnstageLines={onUnstageLines}
          />
        );
      })}
    </div>
  );
};
