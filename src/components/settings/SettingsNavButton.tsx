import React from "react";
import clsx from "clsx";
import type { SettingsTab } from "../../store/useSettingsStore";
import type { NavItem } from "./settingsModalState.helpers";

export interface SettingsNavButtonProps {
  item: NavItem;
  active: boolean;
  onSelect: (tab: SettingsTab) => void;
}

/** One sidebar entry with modern, clean active pill styling. */
export const SettingsNavButton: React.FC<SettingsNavButtonProps> = ({ item, active, onSelect }) => (
  <button
    type="button"
    aria-current={active ? "page" : undefined}
    onClick={() => onSelect(item.id)}
    className={clsx(
      "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors duration-fast ease-macos",
      active
        ? "border border-accent/20 bg-accent-subtle font-medium text-primary shadow-2xs"
        : "border border-transparent text-secondary hover:bg-surface-hover/60 hover:text-primary"
    )}
  >
    <span className={clsx("shrink-0 transition-colors", active ? "text-accent" : "text-tertiary")}>
      {item.icon}
    </span>
    <span>{item.label}</span>
  </button>
);
