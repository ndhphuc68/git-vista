import React from "react";
import clsx from "clsx";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "../../i18n";

export interface DiffLineStageButtonProps {
  hIdx: number;
  lIdx: number;
  isStaged: boolean;
  isHovered: boolean;
  onStageLines: (hunkIndex: number, lineIndices: number[]) => void;
  onUnstageLines: (hunkIndex: number, lineIndices: number[]) => void;
}

/** The per-line stage/unstage button shown on a modified diff line. */
export const DiffLineStageButton: React.FC<DiffLineStageButtonProps> = ({
  hIdx,
  lIdx,
  isStaged,
  isHovered,
  onStageLines,
  onUnstageLines,
}) => {
  const { t } = useTranslation();

  return (
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
  );
};
