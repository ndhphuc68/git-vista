import React from "react";
import { useTranslation } from "../../i18n";
import { APP_VERSION } from "../../domain/constants/app";
import { type SettingsTab } from "../../store/useSettingsStore";
import { type NavGroup } from "./settingsModalState.helpers";
import { SettingsNavButton } from "./SettingsNavButton";

export interface SettingsModalSidebarProps {
  navGroups: NavGroup[];
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

/** Left-hand navigation for the settings modal, grouped by scope. */
export const SettingsModalSidebar: React.FC<SettingsModalSidebarProps> = ({
  navGroups,
  activeTab,
  setActiveTab,
}) => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t.settings.title}
      className="flex w-56 shrink-0 flex-col justify-between border-r border-border-subtle bg-surface-header/20 p-3"
    >
      <div className="flex flex-col gap-5">
        {navGroups.map((group) => (
          <div key={group.id} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-tertiary">
              {group.label}
            </div>
            {group.items.map((item) => (
              <SettingsNavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onSelect={setActiveTab}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-1 text-xs text-tertiary">
        <span className="font-semibold text-secondary">{t.appTitle}</span>
        <span>{t.settings.sidebar.version.replace("{version}", APP_VERSION)}</span>
      </div>
    </nav>
  );
};
