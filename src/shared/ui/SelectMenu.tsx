import React, { useEffect, useRef } from "react";
import { Z_INDEX } from "../../domain/constants/zIndex";
import { Input } from "./Input";
import { SelectOptionRow } from "./SelectOptionRow";
import type { NormalizedGroup, SelectOption } from "./selectOptions";

export interface SelectMenuProps {
  listboxId: string;
  ariaLabel?: string;
  groups: NormalizedGroup[];
  groupId: (index: number) => string;
  optionId: (value: string) => string;
  selectedValue: string;
  activeValue: string | null;
  activeId?: string;
  mono: boolean;
  searchable: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onChoose: (option: SelectOption) => void;
  onActivate: (value: string) => void;
}

const GROUP_LABEL = "px-2.5 py-1 text-[10px] font-semibold text-secondary uppercase tracking-wider";

/** The popover: optional search box plus the grouped `role="listbox"`. */
export const SelectMenu: React.FC<SelectMenuProps> = (props) => {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (props.searchable) searchRef.current?.focus();
  }, [props.searchable]);

  useEffect(() => {
    // jsdom has no scrollIntoView, hence the optional call.
    if (props.activeId)
      document.getElementById(props.activeId)?.scrollIntoView?.({ block: "nearest" });
  }, [props.activeId]);

  const renderOption = (option: SelectOption) => (
    <SelectOptionRow
      key={option.value}
      id={props.optionId(option.value)}
      option={option}
      isSelected={option.value === props.selectedValue}
      isActive={option.value === props.activeValue}
      mono={props.mono}
      onChoose={props.onChoose}
      onActivate={props.onActivate}
    />
  );

  return (
    <div
      className="absolute left-0 right-0 top-full mt-1 flex flex-col overflow-hidden rounded-md border border-border-subtle bg-surface shadow-2xl animate-fade-in"
      style={{ zIndex: Z_INDEX.dropdown }}
    >
      {props.searchable && (
        <div className="p-2 border-b border-border-subtle shrink-0">
          <Input
            ref={searchRef}
            role="searchbox"
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            onKeyDown={props.onKeyDown}
            placeholder={props.searchPlaceholder}
            aria-label={props.searchPlaceholder}
            aria-controls={props.listboxId}
            aria-activedescendant={props.activeId}
          />
        </div>
      )}
      <ul
        id={props.listboxId}
        role="listbox"
        aria-label={props.ariaLabel}
        className="max-h-52 overflow-y-auto p-1 flex flex-col gap-0.5"
      >
        {props.groups.map((group, index) =>
          group.label === null ? (
            group.options.map(renderOption)
          ) : (
            <li key={group.label} role="presentation">
              <div id={props.groupId(index)} className={GROUP_LABEL}>
                {group.label}
              </div>
              <ul role="group" aria-labelledby={props.groupId(index)}>
                {group.options.map(renderOption)}
              </ul>
            </li>
          )
        )}
        {props.groups.length === 0 && props.emptyText && (
          <li role="presentation" className="px-3 py-4 text-center text-xs text-secondary">
            {props.emptyText}
          </li>
        )}
      </ul>
    </div>
  );
};
