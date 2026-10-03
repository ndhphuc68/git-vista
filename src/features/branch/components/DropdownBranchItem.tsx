import React from "react";
import clsx from "clsx";
import { GitBranch, Check } from "lucide-react";

export interface DropdownBranchItemProps {
  name: string;
  isSelected: boolean;
  isHead?: boolean;
  onClick: () => void;
}

/** Single branch or commit item inside BaseBranchDropdownMenu. */
export const DropdownBranchItem: React.FC<DropdownBranchItemProps> = ({
  name,
  isSelected,
  isHead,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-left font-mono text-xs transition-colors cursor-pointer",
      isSelected
        ? "bg-accent-subtle text-accent font-semibold"
        : "text-primary hover:bg-surface-hover"
    )}
  >
    <GitBranch size={13} className={isSelected ? "text-accent" : "text-secondary"} />
    <span className="truncate">{name}</span>
    {isHead && (
      <span className="text-[10px] text-accent px-1.5 py-0.2 bg-accent/10 rounded-xs font-semibold ml-auto shrink-0">
        HEAD
      </span>
    )}
    {isSelected && (
      <Check size={12} className={clsx("text-accent shrink-0", !isHead && "ml-auto")} />
    )}
  </button>
);
