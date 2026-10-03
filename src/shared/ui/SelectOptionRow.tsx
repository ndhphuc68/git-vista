import React from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import type { SelectOption } from "./selectOptions";

export interface SelectOptionRowProps {
  id: string;
  option: SelectOption;
  isSelected: boolean;
  isActive: boolean;
  mono: boolean;
  onChoose: (option: SelectOption) => void;
  onActivate: (value: string) => void;
}

/** One `role="option"` row. Keyboard handling lives on the combobox, not here. */
export const SelectOptionRow: React.FC<SelectOptionRowProps> = ({
  id,
  option,
  isSelected,
  isActive,
  mono,
  onChoose,
  onActivate,
}) => (
  <li
    id={id}
    role="option"
    aria-selected={isSelected}
    aria-disabled={option.disabled || undefined}
    // Keep focus on the trigger or search input while clicking.
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => onChoose(option)}
    onMouseEnter={() => !option.disabled && onActivate(option.value)}
    className={clsx(
      "flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-xs transition-colors",
      isSelected ? "bg-accent-subtle text-accent font-semibold" : "text-primary",
      isActive && !isSelected && "bg-surface-hover",
      option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      mono && "font-mono"
    )}
  >
    {option.icon}
    <span className="truncate">{option.label}</span>
    <span className="ml-auto flex items-center gap-1.5 shrink-0">
      {option.badge}
      {isSelected && <Check size={12} className="text-accent" aria-hidden="true" />}
    </span>
  </li>
);
