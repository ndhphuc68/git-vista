import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useEscapeKey } from "../hooks/useEscapeKey";
import {
  filterGroups,
  findOption,
  navigableOptions,
  normalizeGroups,
  type SelectItems,
  type SelectOption,
} from "./selectOptions";
import { createSelectKeyDown } from "./useSelect.actions";

export interface UseSelectArgs {
  value: string;
  onChange: (value: string) => void;
  items: SelectItems;
  disabled?: boolean;
}

/** Closes the dropdown when the user presses the mouse outside `container`. */
function useOutsideMouseDown(
  container: RefObject<HTMLElement | null>,
  enabled: boolean,
  onOutside: () => void
) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      if (container.current && !container.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [container, enabled, onOutside]);
}

/** State, filtering and keyboard navigation for the shared `Select`. */
export function useSelect({ value, onChange, items, disabled }: UseSelectArgs) {
  const baseId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const groups = useMemo(() => normalizeGroups(items), [items]);
  const visibleGroups = useMemo(() => filterGroups(groups, search), [groups, search]);
  const navigable = useMemo(() => navigableOptions(visibleGroups), [visibleGroups]);
  const selected = findOption(groups, value);

  // Fall back to the first visible option when the active one is filtered out.
  const active = navigable.find((option) => option.value === activeValue) ?? navigable[0];

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch("");
  }, []);
  const closeAndFocus = useCallback(() => {
    close();
    triggerRef.current?.focus();
  }, [close]);

  useEscapeKey(isOpen, closeAndFocus);
  useOutsideMouseDown(containerRef, isOpen, close);

  const open = () => {
    if (disabled) return;
    setActiveValue(value);
    setIsOpen(true);
  };
  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    closeAndFocus();
  };
  const onKeyDown = createSelectKeyDown({
    isOpen,
    open,
    close,
    navigable,
    activeValue: active?.value ?? null,
    setActiveValue,
    choose,
  });

  const optionId = (optionValue: string) => `${baseId}-option-${encodeURIComponent(optionValue)}`;

  return {
    isOpen,
    toggle: () => (isOpen ? close() : open()),
    search,
    setSearch,
    containerRef,
    triggerRef,
    listboxId: `${baseId}-listbox`,
    groupId: (index: number) => `${baseId}-group-${index}`,
    optionId,
    visibleGroups,
    selected,
    activeValue: active?.value ?? null,
    activeId: active ? optionId(active.value) : undefined,
    setActiveValue,
    choose,
    onKeyDown,
  };
}
