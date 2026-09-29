import React from "react";
import type { ConflictHunk } from "../../ipc/bindings.generated";
import type { Translations } from "../../i18n/vi";

export interface ConflictHunkMergedColumnProps {
  t: Translations;
  hunk: ConflictHunk;
  isResolved: boolean;
  resolutionValue: string | undefined;
  onSetResolution: (hunkId: string, value: string) => void;
}

export const ConflictHunkMergedColumn: React.FC<ConflictHunkMergedColumnProps> = ({
  t,
  hunk,
  isResolved,
  resolutionValue,
  onSetResolution,
}) => {
  return (
    <div className="flex flex-col border-r border-border-subtle bg-surface">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-surface-subtle">
        <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
          {isResolved ? (
            <span className="text-diff-add-text font-bold">
              {t.conflictResolver.selectedBadge}
            </span>
          ) : (
            <span className="text-secondary font-normal italic">
              {t.conflictResolver.unselectedBadge}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => onSetResolution(hunk.id, (hunk.ours || "") + (hunk.theirs || ""))}
          className="px-2 py-0.5 text-[11px] font-medium bg-surface text-secondary hover:text-primary border border-border-subtle rounded-sm hover:bg-surface-hover transition-all cursor-pointer"
        >
          {t.conflictResolver.takeBoth}
        </button>
      </div>
      <textarea
        rows={Math.max(3, (resolutionValue ?? (hunk.ours || "")).split("\n").length)}
        value={resolutionValue ?? ""}
        onChange={(e) => onSetResolution(hunk.id, e.target.value)}
        placeholder={t.conflictResolver.editorPlaceholder}
        className="flex-1 w-full p-3 font-mono text-xs text-primary bg-transparent focus:outline-none focus:bg-surface-subtle/40 resize-y"
      />
    </div>
  );
};
