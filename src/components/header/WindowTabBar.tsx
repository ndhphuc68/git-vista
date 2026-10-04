import React from "react";
import { Plus, Settings } from "lucide-react";
import { useTabStore } from "../../store/useTabStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";
import { WindowTab } from "./WindowTab";

interface WindowTabBarProps {
  onNewTab?: () => void;
}

export const WindowTabBar: React.FC<WindowTabBarProps> = ({ onNewTab }) => {
  const { tabs, activeTabId, setActiveTab, closeTab, openHomeTab } = useTabStore();
  const { openSettings } = useSettingsStore();
  const { t } = useTranslation();

  const handleNewTab = () => {
    if (onNewTab) {
      onNewTab();
    } else {
      openHomeTab();
    }
  };

  return (
    <div
      data-testid="window-tab-bar"
      className="flex items-end justify-between px-2 h-10 min-h-10 max-h-10 bg-window border-b border-border-subtle select-none z-30 shrink-0 gap-2 pt-1.5"
    >
      {/* Scrollable Tabs Container (100% hidden scrollbar across all platforms) */}
      <div className="flex items-end h-full gap-0 flex-1 min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const nextTab = tabs[idx + 1];
          const isNextActive = nextTab && nextTab.id === activeTabId;
          const showSeparator = !isActive && !isNextActive && idx < tabs.length - 1;

          return (
            <WindowTab
              key={tab.id}
              tab={tab}
              isActive={isActive}
              showSeparator={Boolean(showSeparator)}
              onSelect={() => setActiveTab(tab.id)}
              onClose={() => closeTab(tab.id)}
            />
          );
        })}

        {/* GitVista New Tab Button (+) */}
        <button
          type="button"
          data-testid="btn-new-tab"
          onClick={handleNewTab}
          className="flex items-center justify-center w-7 h-7 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors ml-1 cursor-pointer shrink-0 mb-1 outline-none focus:outline-none focus-visible:outline-none"
          title="Mở tab mới (Home: Mở / Clone) (Ctrl+T)"
          aria-label="New tab"
        >
          <Plus size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Right Controls: Settings Quick Access */}
      <div className="flex items-center gap-1 shrink-0 pr-1 mb-1">
        <button
          type="button"
          data-testid="btn-top-settings"
          onClick={() => openSettings()}
          className="flex items-center justify-center w-7 h-7 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
          title={`${t.settings.title} (Ctrl+,)`}
          aria-label={t.settings.title}
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};
