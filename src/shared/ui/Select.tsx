import React from "react";
import clsx from "clsx";
import { useSelect } from "./useSelect";
import { SelectTrigger } from "./SelectTrigger";
import { SelectMenu } from "./SelectMenu";
import type { SelectItems } from "./selectOptions";
import type { FieldSize } from "./fieldStyles";

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  /** A flat list of options, or labelled groups of options. */
  options: SelectItems;
  /** Put on the trigger, so `<label htmlFor>` names the combobox. */
  id?: string;
  "aria-label"?: string;
  "data-testid"?: string;
  /** Shown in the trigger when `value` matches no option. */
  placeholder?: React.ReactNode;
  disabled?: boolean;
  /** `sm` for dense dropdowns, `md` for settings forms, `lg` for roomy 48px modal forms. */
  size?: FieldSize;
  /** Monospace text, for branch names, SHAs and paths. */
  mono?: boolean;
  /** Adds a filter box at the top of the list. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Shown when the filter matches nothing. */
  emptyText?: string;
  /** Layout only (width, margin); colors come from the component. */
  className?: string;
}

/**
 * Shared dropdown (WAI-ARIA combobox + listbox). Knows nothing about
 * Git-specific business logic — options come in through props, and all
 * user-facing text (placeholder, search, empty state) is passed by the caller.
 *
 * Keyboard: ArrowUp/ArrowDown/Home/End move, Enter picks, Escape closes
 * (only the top-most layer, via `useEscapeKey`), Tab closes and moves on.
 */
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  id,
  "aria-label": ariaLabel,
  "data-testid": testId,
  placeholder,
  disabled,
  size = "sm",
  mono = false,
  searchable = false,
  searchPlaceholder,
  emptyText,
  className,
}) => {
  const select = useSelect({ value, onChange, items: options, disabled });

  return (
    <div ref={select.containerRef} className={clsx("relative", className)}>
      <SelectTrigger
        ref={select.triggerRef}
        id={id}
        ariaLabel={ariaLabel}
        testId={testId}
        isOpen={select.isOpen}
        listboxId={select.listboxId}
        activeId={searchable ? undefined : select.activeId}
        selected={select.selected}
        placeholder={placeholder}
        disabled={disabled}
        mono={mono}
        size={size}
        onToggle={select.toggle}
        onKeyDown={select.onKeyDown}
      />
      {select.isOpen && (
        <SelectMenu
          listboxId={select.listboxId}
          ariaLabel={ariaLabel}
          groups={select.visibleGroups}
          groupId={select.groupId}
          optionId={select.optionId}
          selectedValue={value}
          activeValue={select.activeValue}
          activeId={select.activeId}
          mono={mono}
          searchable={searchable}
          search={select.search}
          onSearchChange={select.setSearch}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          onKeyDown={select.onKeyDown}
          onChoose={select.choose}
          onActivate={select.setActiveValue}
        />
      )}
    </div>
  );
};
