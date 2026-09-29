/**
 * One folder row of the local branch tree: the expand/collapse header plus
 * the branch count badge. The recursively rendered children are passed in by
 * the caller so this file has no dependency on the tree-node dispatch itself.
 */
import React from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";

export interface BranchFolderRowProps {
  name: string;
  isExpanded: boolean;
  count: number;
  onToggle: () => void;
  children: React.ReactNode;
}

export const BranchFolderRow: React.FC<BranchFolderRowProps> = ({
  name,
  isExpanded,
  count,
  onToggle,
  children,
}) => (
  <div className="flex flex-col mt-0.5">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between px-2 py-1 rounded-sm hover:bg-surface-hover text-primary font-semibold text-xs cursor-pointer border-0 bg-transparent text-left group transition-colors"
    >
      <div className="flex items-center gap-1.5 truncate">
        <span className="text-secondary group-hover:text-primary">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <Folder size={13} className="text-amber-500 shrink-0 fill-amber-500/20" />
        <span className="truncate">{name}</span>
      </div>
      <span className="text-[10px] font-mono text-tertiary px-1.5 bg-surface-hover rounded-full">
        {count}
      </span>
    </button>

    {isExpanded && (
      <div className="tree-guide border-l border-border-subtle ml-3 pl-2 flex flex-col gap-0.5 mt-0.5">
        {children}
      </div>
    )}
  </div>
);
