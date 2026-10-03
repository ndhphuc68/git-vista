import React from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { SelectOption } from "./selectOptions";

export interface SelectTriggerProps {
  ref: React.Ref<HTMLButtonElement>;
  id?: string;
  ariaLabel?: string;
  testId?: string;
  isOpen: boolean;
  listboxId: string;
  /** Set only when focus stays on the trigger (no search input). */
  activeId?: string;
  selected?: SelectOption;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  mono: boolean;
  onToggle: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/** The `role="combobox"` button that shows the current value and opens the list. */
export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  ref,
  id,
  ariaLabel,
  testId,
  isOpen,
  listboxId,
  activeId,
  selected,
  placeholder,
  disabled,
  mono,
  onToggle,
  onKeyDown,
}) => (
  <button
    ref={ref}
    id={id}
    type="button"
    role="combobox"
    aria-label={ariaLabel}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-controls={isOpen ? listboxId : undefined}
    aria-activedescendant={isOpen ? activeId : undefined}
    data-testid={testId}
    disabled={disabled}
    onClick={onToggle}
    onKeyDown={onKeyDown}
    className={clsx(
      "w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-xs",
      "bg-window text-primary border outline-none transition-colors cursor-pointer",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      isOpen
        ? "border-accent"
        : "border-border-subtle hover:border-border-strong focus-visible:border-accent",
      mono && "font-mono"
    )}
  >
    <span className="flex items-center gap-2 min-w-0">
      {selected?.icon}
      <span className={clsx("truncate", selected ? "font-semibold" : "text-tertiary")}>
        {selected ? selected.label : placeholder}
      </span>
      {selected?.badge}
    </span>
    <ChevronDown
      size={13}
      aria-hidden="true"
      className={clsx(
        "text-secondary shrink-0 transition-transform duration-150",
        isOpen && "rotate-180"
      )}
    />
  </button>
);
