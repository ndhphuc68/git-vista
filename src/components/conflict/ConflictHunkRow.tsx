import React from "react";
import type { ConflictHunk } from "../../ipc/bindings.generated";
import type { Translations } from "../../i18n/vi";
import { ConflictHunkOursColumn } from "./ConflictHunkOursColumn";
import { ConflictHunkMergedColumn } from "./ConflictHunkMergedColumn";
import { ConflictHunkTheirsColumn } from "./ConflictHunkTheirsColumn";

export interface ConflictHunkRowProps {
  t: Translations;
  hunk: ConflictHunk;
  idx: number;
  isResolved: boolean;
  resolutionValue: string | undefined;
  onSetResolution: (hunkId: string, value: string) => void;
  registerHunkRef: (hunkId: string, el: HTMLDivElement | null) => void;
}

export const ConflictHunkRow: React.FC<ConflictHunkRowProps> = ({
  t,
  hunk,
  idx,
  isResolved,
  resolutionValue,
  onSetResolution,
  registerHunkRef,
}) => {
  if (!hunk.is_conflict) {
    return (
      <div
        key={hunk.id || `hunk_${idx}`}
        className="w-full bg-surface-subtle/30 px-4 py-1.5 border-b border-border-subtle/50 font-mono text-xs text-secondary whitespace-pre-wrap select-text leading-relaxed"
      >
        {hunk.content}
      </div>
    );
  }

  return (
    <div
      key={hunk.id}
      ref={(el) => registerHunkRef(hunk.id, el)}
      className="w-full border-b-2 border-border-strong bg-surface"
    >
      {/* Conflict Hunk 3 Columns */}
      <div className="grid grid-cols-3 min-h-[140px]">
        <ConflictHunkOursColumn t={t} hunk={hunk} onSetResolution={onSetResolution} />
        <ConflictHunkMergedColumn
          t={t}
          hunk={hunk}
          isResolved={isResolved}
          resolutionValue={resolutionValue}
          onSetResolution={onSetResolution}
        />
        <ConflictHunkTheirsColumn t={t} hunk={hunk} onSetResolution={onSetResolution} />
      </div>
    </div>
  );
};
