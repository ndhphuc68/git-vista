import React from "react";
import { type SettingsTab } from "../../store/useSettingsStore";
import { type NavItem } from "./useSettingsModalState";

export interface SettingsModalSidebarProps {
  navItems: NavItem[];
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

/** Left-hand navigation for the settings modal's tabs. */
export const SettingsModalSidebar: React.FC<SettingsModalSidebarProps> = ({
  navItems,
  activeTab,
  setActiveTab,
}) => (
  <div className="w-60 shrink-0 border-r border-border-subtle bg-surface-header/20 p-4 flex flex-col justify-between">
    <div className="flex flex-col gap-1.5">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              isActive
                ? "bg-accent text-white font-semibold shadow-xs"
                : "text-secondary hover:bg-surface-hover hover:text-primary"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
    <div className="flex flex-col gap-0.5 px-2 py-1 text-[11px] text-tertiary">
      <span className="font-semibold text-secondary">GitVista</span>
      <span>v0.1.0 • macOS Edition</span>
    </div>
  </div>
);
