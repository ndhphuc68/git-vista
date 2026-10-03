import type { ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  /** Leading icon, shown in the list and in the trigger when selected. */
  icon?: ReactNode;
  /** Trailing badge, such as a "HEAD" marker. */
  badge?: ReactNode;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

/** Either a flat list of options or a list of labelled groups. */
export type SelectItems = readonly SelectOption[] | readonly SelectGroup[];

/** Internal shape: every list is grouped; a flat list becomes one unlabelled group. */
export interface NormalizedGroup {
  label: string | null;
  options: SelectOption[];
}

function isGroupList(items: SelectItems): items is readonly SelectGroup[] {
  const first = items[0];
  return first !== undefined && "options" in first;
}

export function normalizeGroups(items: SelectItems): NormalizedGroup[] {
  if (items.length === 0) return [];
  if (isGroupList(items)) {
    return items.map((group) => ({ label: group.label, options: group.options }));
  }
  return [{ label: null, options: [...items] }];
}

/** Keeps options whose label contains `query` (case-insensitive) and drops empty groups. */
export function filterGroups(groups: NormalizedGroup[], query: string): NormalizedGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;
  return groups
    .map((group) => ({
      label: group.label,
      options: group.options.filter((option) => option.label.toLowerCase().includes(needle)),
    }))
    .filter((group) => group.options.length > 0);
}

/** The options keyboard navigation can land on, in display order. */
export function navigableOptions(groups: NormalizedGroup[]): SelectOption[] {
  return groups.flatMap((group) => group.options.filter((option) => !option.disabled));
}

export function findOption(groups: NormalizedGroup[], value: string): SelectOption | undefined {
  for (const group of groups) {
    const match = group.options.find((option) => option.value === value);
    if (match) return match;
  }
  return undefined;
}

/** Index of the option `step` places away from `current`, clamped to the list. */
export function stepIndex(length: number, current: number, step: number): number {
  if (length === 0) return -1;
  if (current < 0) return step > 0 ? 0 : length - 1;
  return Math.min(Math.max(current + step, 0), length - 1);
}
