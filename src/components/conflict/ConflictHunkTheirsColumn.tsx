import React from "react";
import type { ConflictHunk } from "../../ipc/bindings.generated";
import type { Translations } from "../../i18n/vi";

export interface ConflictHunkTheirsColumnProps {
  t: Translations;
  hunk: ConflictHunk;
  onSetResolution: (hunkId: string, value: string) => void;
}

export const ConflictHunkTheirsColumn: React.FC<ConflictHunkTheirsColumnProps> = ({
  t,
  hunk,
  onSetResolution,
}) => {
  return (
    <div className="flex flex-col bg-accent-subtle/20">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-accent-subtle/40">
        <span className="text-[11px] font-semibold text-primary truncate">
          {hunk.theirs_label || "THEIRS"}
        </span>
        <button
          type="button"
          onClick={() => onSetResolution(hunk.id, hunk.theirs || "")}
          className="px-2 py-0.5 text-[11px] font-medium bg-accent-subtle text-primary border border-border-subtle rounded-sm hover:brightness-95 transition-all cursor-pointer"
        >
          {t.conflictResolver.acceptTheirs}
        </button>
      </div>
      <pre className="flex-1 p-3 font-mono text-xs text-primary whitespace-pre-wrap overflow-x-auto select-text">
        {hunk.theirs || ""}
      </pre>
    </div>
  );
};
