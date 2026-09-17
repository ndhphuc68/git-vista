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
      {/* Scrollable Windows 11 Explorer Tabs Container */}
      <div className="flex items-end h-full gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar pt-1">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const prevTab = tabs[idx - 1];
          const isPrevActive = prevTab && prevTab.id === activeTabId;

          if (tab.type === "home") {
            return (
              <React.Fragment key="home">
                <button
                  type="button"
                  data-testid="tab-home"
                  onClick={() => setActiveTab("home")}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer transition-all duration-150 shrink-0 select-none",
                    isActive
                      ? "relative bg-surface text-primary font-medium border-t border-l border-r border-border-subtle/80 shadow-2xs after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                      : "text-secondary hover:text-primary hover:bg-surface-hover/60 font-normal"
                  )}
                  title="Home (Welcome)"
                >
                  <Home
                    size={14}
                    className={clsx("shrink-0", isActive ? "text-accent" : "text-secondary")}
                  />
                  <span>Home</span>
                </button>
                {!isActive && !isPrevActive && (
                  <div className="h-3.5 w-px bg-border-subtle/60 my-auto shrink-0" />
                )}
              </React.Fragment>
            );
          }

          const repoName = tab.alias || tab.repo?.name || tab.id.split("/").pop() || "repository";
          const branchName = tab.selectedBranch || tab.repo?.head_branch;

          return (
            <React.Fragment key={tab.id}>
              <div
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer transition-all duration-150 shrink-0 min-w-[150px] max-w-[240px] select-none",
                  isActive
                    ? "relative bg-surface text-primary font-medium border-t border-l border-r border-border-subtle/80 shadow-2xs after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                    : "text-secondary hover:text-primary hover:bg-surface-hover/60 font-normal"
                )}
                title={`${repoName} - ${tab.id}`}
              >
                <FolderGit2
                  size={14}
                  className={clsx(
                    "shrink-0",
                    isActive ? "text-amber-500" : "text-secondary group-hover:text-primary"
                  )}
                />
                <span className="truncate">{repoName}</span>

                {branchName && (
                  <div
                    className={clsx(
                      "flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 max-w-[85px] truncate border",
                      isActive
                        ? "bg-surface-header/80 text-secondary border-border-subtle"
                        : "bg-surface-header/40 text-tertiary border-border-subtle/50"
                    )}
                    title={`Branch: ${branchName}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
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
                    "ml-auto flex items-center justify-center w-5 h-5 rounded hover:bg-surface-hover transition-all shrink-0",
                    isActive
                      ? "text-secondary hover:text-primary"
                      : "opacity-0 group-hover:opacity-100 text-tertiary hover:text-primary"
                  )}
                  aria-label={`Close tab ${repoName}`}
                >
                  <X size={12} />
                </button>
              </div>
              {!isActive && (
                <div className="h-3.5 w-px bg-border-subtle/60 my-auto shrink-0" />
              )}
            </React.Fragment>
          );
        })}

        {/* Windows 11 Style Minimal New Tab Button (+) */}
        <button
          type="button"
          data-testid="btn-new-tab"
          onClick={handleNewTab}
          className="flex items-center justify-center w-7 h-7 rounded-md text-secondary hover:text-primary hover:bg-surface-hover transition-colors mb-0.5 ml-1 cursor-pointer shrink-0 font-light text-base"
          title="Mở tab mới (Home: Mở / Clone) (Ctrl+T)"
          aria-label="New tab"
        >
          <Plus size={15} />
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
