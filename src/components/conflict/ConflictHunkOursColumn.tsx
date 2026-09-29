import React from "react";
import type { ConflictHunk } from "../../ipc/bindings.generated";
import type { Translations } from "../../i18n/vi";

export interface ConflictHunkOursColumnProps {
  t: Translations;
  hunk: ConflictHunk;
  onSetResolution: (hunkId: string, value: string) => void;
}

export const ConflictHunkOursColumn: React.FC<ConflictHunkOursColumnProps> = ({
  t,
  hunk,
  onSetResolution,
}) => {
  return (
    <div className="flex flex-col border-r border-border-subtle bg-diff-add-bg/15">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-diff-add-bg/30">
        <span className="text-[11px] font-semibold text-diff-add-text truncate">
          {hunk.ours_label || "HEAD"}
        </span>
        <button
          type="button"
          onClick={() => onSetResolution(hunk.id, hunk.ours || "")}
          className="px-2 py-0.5 text-[11px] font-medium bg-diff-add-bg text-diff-add-text border border-diff-add-border rounded-sm hover:brightness-95 transition-all cursor-pointer"
        >
          {t.conflictResolver.acceptOurs}
        </button>
      </div>
      <pre className="flex-1 p-3 font-mono text-xs text-diff-add-text whitespace-pre-wrap overflow-x-auto select-text">
        {hunk.ours || ""}
      </pre>
    </div>
  );
};
