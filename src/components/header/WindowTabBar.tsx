import React from "react";
import { Home, FolderGit2, Plus, X, Settings, GitBranch } from "lucide-react";
import { clsx } from "clsx";
import { useTabStore } from "../../store/useTabStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";

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
      className="flex items-center justify-between px-2 h-[38px] min-h-[38px] max-h-[38px] bg-window border-b border-border-subtle select-none z-30 shrink-0 gap-2"
    >
      {/* Scrollable Flush Tabs Container */}
      <div className="flex items-end h-full gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar pt-1">
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
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs cursor-pointer transition-all duration-150 shrink-0 select-none",
                  isActive
                    ? "relative bg-surface text-primary font-bold border-t border-l border-r border-border shadow-2xs before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-accent before:rounded-t-md after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                    : "text-secondary hover:text-primary hover:bg-surface/50 font-medium"
                )}
                title="Home (Welcome)"
              >
                <Home
                  size={13}
                  className={clsx("shrink-0", isActive ? "text-accent" : "text-secondary")}
                />
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
                "group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs cursor-pointer transition-all duration-150 shrink-0 max-w-[220px] select-none",
                isActive
                  ? "relative bg-surface text-primary font-bold border-t border-l border-r border-border shadow-2xs before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-accent before:rounded-t-md after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                  : "text-secondary hover:text-primary hover:bg-surface/50 font-medium"
              )}
              title={`${repoName} - ${tab.id}`}
            >
              <FolderGit2
                size={13}
                className={clsx(
                  "shrink-0",
                  isActive ? "text-accent" : "text-secondary group-hover:text-primary"
                )}
              />
              <span className="truncate">{repoName}</span>

              {branchName && (
                <div
                  className={clsx(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 max-w-[85px] truncate border",
                    isActive
                      ? "bg-accent-subtle text-accent border-accent/30 font-semibold"
                      : "bg-surface/80 text-secondary border-border-subtle/70"
                  )}
                  title={`Branch: ${branchName}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <GitBranch size={9} className="shrink-0 text-emerald-600" />
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
                className={clsx(
                  "flex items-center justify-center w-4 h-4 rounded-full transition-all ml-0.5 shrink-0",
                  isActive
                    ? "text-secondary hover:text-primary hover:bg-surface-hover"
                    : "text-tertiary opacity-70 group-hover:opacity-100 hover:bg-surface-hover hover:text-primary"
                )}
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
          className="flex items-center justify-center w-6 h-6 rounded-md text-secondary hover:text-primary hover:bg-surface/60 transition-colors mb-1 ml-1 cursor-pointer shrink-0"
          title="Mở tab mới (Home: Mở / Clone) (Ctrl+T)"
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
          className="flex items-center justify-center w-7 h-7 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          title={`${t.settings.title} (Ctrl+,)`}
          aria-label={t.settings.title}
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};
