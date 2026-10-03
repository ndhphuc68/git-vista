import React from "react";
import clsx from "clsx";
import { GitBranch, ChevronDown } from "lucide-react";

export interface BaseBranchTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  displayLabel: string;
  isHeadSelected: boolean;
}

/** Trigger button for BaseBranchSelect dropdown. */
export const BaseBranchTrigger: React.FC<BaseBranchTriggerProps> = ({
  isOpen,
  onToggle,
  disabled,
  displayLabel,
  isHeadSelected,
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    className={clsx(
      "w-full bg-window text-primary border rounded-sm px-2.5 py-1.5 text-xs font-mono transition-colors flex items-center justify-between gap-2 cursor-pointer outline-none",
      isOpen
        ? "border-accent ring-1 ring-accent"
        : "border-border-subtle hover:border-border-strong",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <div className="flex items-center gap-2 min-w-0 truncate">
      <GitBranch size={13} className="text-accent shrink-0" />
      <span className="truncate font-semibold">{displayLabel}</span>
      {isHeadSelected && (
        <span className="text-[10px] text-accent px-1.5 py-0.2 bg-accent/10 rounded-xs font-semibold shrink-0">
          HEAD
        </span>
      )}
    </div>
    <ChevronDown
      size={13}
      className={clsx(
        "text-secondary shrink-0 transition-transform duration-150",
        isOpen && "rotate-180"
      )}
    />
  </button>
);
