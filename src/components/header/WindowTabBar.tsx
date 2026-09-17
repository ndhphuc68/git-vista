import React from "react";
import { Home, FolderGit2, Plus, X, Settings, GitBranch } from "lucide-react";
import { clsx } from "clsx";
import { useTabStore } from "../../store/useTabStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";

interface WindowTabBarProps {
  onSelectFolder?: () => void;
}

export const WindowTabBar: React.FC<WindowTabBarProps> = ({ onSelectFolder }) => {
  const { tabs, activeTabId, setActiveTab, closeTab, openHomeTab } = useTabStore();
  const { openSettings } = useSettingsStore();
  const { t } = useTranslation();

  const handleNewTab = () => {
    if (onSelectFolder) {
      onSelectFolder();
    } else {
      openHomeTab();
    }
  };

  return (
    <div
      data-testid="window-tab-bar"
      className="flex items-center justify-between px-2.5 h-[38px] min-h-[38px] max-h-[38px] bg-window border-b border-border-subtle select-none z-30 shrink-0 gap-2"
    >
      {/* Left side: Window Traffic lights / Branding spacer */}
      <div className="flex items-center gap-2 pl-1 pr-2 shrink-0">
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/30 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/30 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/30 inline-block" />
        </div>
      </div>

      {/* Center: Scrollable Tabs Container */}
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          if (tab.type === "home") {
            return (
              <button
                key="home"
                type="button"
                data-testid="tab-home"
                onClick={() => setActiveTab("home")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 shrink-0",
                  isActive
                    ? "bg-surface text-primary font-semibold shadow-2xs border border-border-subtle"
                    : "text-secondary hover:bg-surface-hover hover:text-primary"
                )}
                title="Home (Welcome)"
              >
                <Home size={13} className={isActive ? "text-accent" : "text-secondary"} />
                <span>Home</span>
              </button>
            );
          }

          const repoName = tab.alias || tab.repo?.name || tab.id.split("/").pop() || "repository";
          const branchName = tab.selectedBranch || tab.repo?.head_branch;

          return (
            <div
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs cursor-pointer transition-all duration-150 shrink-0 max-w-[200px] border",
                isActive
                  ? "bg-surface text-primary font-semibold shadow-2xs border-border-subtle"
                  : "border-transparent text-secondary hover:bg-surface-hover hover:text-primary"
              )}
              title={`${repoName} - ${tab.id}`}
            >
              <FolderGit2
                size={13}
                className={clsx("shrink-0", isActive ? "text-accent" : "text-tertiary")}
              />
              <span className="truncate">{repoName}</span>

              {branchName && (
                <div
                  className={clsx(
                    "flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 max-w-[80px] truncate",
                    isActive
                      ? "bg-accent-subtle text-accent font-semibold"
                      : "bg-surface-header/60 text-secondary"
                  )}
                  title={`Branch: ${branchName}`}
                >
                  <GitBranch size={9} className="shrink-0" />
                  <span className="truncate">{branchName}</span>
                </div>
              )}

              <button
                type="button"
                data-testid={`close-tab-${tab.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="flex items-center justify-center w-4 h-4 rounded-full text-secondary opacity-60 group-hover:opacity-100 hover:bg-surface hover:text-primary transition-all ml-0.5 shrink-0"
                aria-label={`Close tab ${repoName}`}
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        {/* New Tab Button (+) */}
        <button
          type="button"
          data-testid="btn-new-tab"
          onClick={handleNewTab}
          className="flex items-center justify-center w-6 h-6 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors shrink-0"
          title="Mở repository mới (Ctrl+T)"
          aria-label="New tab"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Right Controls: Settings Quick Access */}
      <div className="flex items-center gap-1 shrink-0 pr-1">
        <button
          type="button"
          data-testid="btn-top-settings"
          onClick={() => openSettings()}
          className="flex items-center justify-center w-7 h-7 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
          title={`${t.settings.title} (Ctrl+,)`}
          aria-label={t.settings.title}
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};
