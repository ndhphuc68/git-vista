import React from "react";
import clsx from "clsx";
import type { SettingsTab } from "../../store/useSettingsStore";
import type { NavItem } from "./settingsModalState.helpers";

export interface SettingsNavButtonProps {
  item: NavItem;
  active: boolean;
  onSelect: (tab: SettingsTab) => void;
}

/** One sidebar entry; the active entry gets a left accent bar. */
export const SettingsNavButton: React.FC<SettingsNavButtonProps> = ({ item, active, onSelect }) => (
  <button
    type="button"
    aria-current={active ? "page" : undefined}
    onClick={() => onSelect(item.id)}
    className={clsx(
      "relative flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
      active
        ? "bg-surface-hover font-medium text-primary"
        : "text-secondary hover:bg-surface-hover/60 hover:text-primary"
    )}
  >
    {active && (
      <span
        aria-hidden="true"
        className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-accent"
      />
    )}
    {item.icon}
    <span>{item.label}</span>
  </button>
);
