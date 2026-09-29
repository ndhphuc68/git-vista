import React from "react";
import clsx from "clsx";
import type { CompareFileItem } from "../../ipc/bindings.generated";
import { CompareFileStatusBadge } from "./CompareFileStatusBadge";

interface CompareFileRowProps {
  file: CompareFileItem;
  isSelected: boolean;
  onSelect: (file: CompareFileItem) => void;
}

export const CompareFileRow: React.FC<CompareFileRowProps> = ({ file, isSelected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(file)}
    className={clsx(
      "w-full flex items-center justify-between px-3 py-2 text-left text-xs gap-2 cursor-pointer transition-colors border-l-2",
      isSelected
        ? "bg-accent/15 border-accent text-primary font-medium"
        : "border-transparent text-secondary hover:bg-surface-hover hover:text-primary"
    )}
  >
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <CompareFileStatusBadge status={file.status} />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-mono text-xs truncate" title={file.path}>
          {file.path}
        </span>
        {file.old_path && (
          <span className="font-mono text-[10px] text-tertiary truncate">← {file.old_path}</span>
        )}
      </div>
    </div>

    {/* Stat numbers */}
    <div className="flex items-center gap-1 font-mono text-[11px] shrink-0">
      {file.additions > 0 && <span className="text-diff-add-text">+{file.additions}</span>}
      {file.deletions > 0 && <span className="text-diff-remove-text">-{file.deletions}</span>}
    </div>
  </button>
);
