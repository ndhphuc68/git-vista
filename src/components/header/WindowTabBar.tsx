import React from "react";
import { Plus, X, Settings, GitBranch, Home, FolderGit2 } from "lucide-react";
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
      className="flex items-end justify-between px-2 h-[40px] min-h-[40px] max-h-[40px] bg-[#ebf0f5] dark:bg-[#121722] border-b border-[#d2dbe4] dark:border-[#1e2533] select-none z-30 shrink-0 gap-2 pt-1.5"
    >
      {/* Scrollable Tabs Container (100% hidden scrollbar across all platforms) */}
      <div className="flex items-end h-full gap-0 flex-1 min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const nextTab = tabs[idx + 1];
          const isNextActive = nextTab && nextTab.id === activeTabId;

          if (tab.type === "home") {
            return (
              <React.Fragment key="home">
                <div
                  data-testid="tab-home"
                  onClick={() => setActiveTab("home")}
                  className={clsx(
                    "group relative flex items-center gap-2 px-3.5 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 select-none min-w-[140px] max-w-[200px] outline-none focus:outline-none focus-visible:outline-none ring-0",
                    isActive
                      ? "bg-surface text-primary font-medium after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                      : "text-secondary hover:text-primary hover:bg-surface/50 dark:hover:bg-white/[0.04] font-normal"
                  )}
                  title="Home (Welcome)"
                >
                  <Home
                    size={14}
                    className={clsx(
                      "shrink-0",
                      isActive ? "text-accent" : "text-secondary group-hover:text-primary"
                    )}
                  />
                  <span className="truncate">Home</span>
                </div>
                {!isActive && !isNextActive && idx < tabs.length - 1 && (
                  <div className="h-4 w-[1px] bg-border-subtle/80 dark:bg-slate-700/60 my-auto shrink-0 mx-0.5" />
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
                  "group relative flex items-center gap-2 px-3 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 min-w-[150px] max-w-[240px] select-none outline-none focus:outline-none focus-visible:outline-none ring-0",
                  isActive
                    ? "bg-surface text-primary font-medium after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                    : "text-secondary hover:text-primary hover:bg-surface/50 dark:hover:bg-white/[0.04] font-normal"
                )}
                title={`${repoName} - ${tab.id}`}
              >
                <FolderGit2
                  size={15}
                  className={clsx(
                    "shrink-0",
                    isActive ? "text-accent" : "text-secondary group-hover:text-primary"
                  )}
                />
                <span className="truncate">{repoName}</span>

                {branchName && (
                  <span
                    className={clsx(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 max-w-[85px] truncate border",
                      isActive
                        ? "bg-accent-subtle text-accent border-accent/25 font-semibold"
                        : "bg-surface-header/40 text-secondary border-border-subtle/50"
                    )}
                    title={`Branch: ${branchName}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <GitBranch
                      size={9}
                      className="shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="truncate">{branchName}</span>
                  </span>
                )}

                <button
                  type="button"
                  data-testid={`close-tab-${tab.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-auto flex items-center justify-center w-5 h-5 rounded hover:bg-surface-hover dark:hover:bg-white/10 text-secondary hover:text-primary transition-colors shrink-0 outline-none focus:outline-none"
                  aria-label={`Close tab ${repoName}`}
                >
                  <X size={12} strokeWidth={1.75} />
                </button>
              </div>
              {!isActive && !isNextActive && idx < tabs.length - 1 && (
                <div className="h-4 w-[1px] bg-border-subtle/80 dark:bg-slate-700/60 my-auto shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}

        {/* GitVista New Tab Button (+) */}
        <button
          type="button"
          data-testid="btn-new-tab"
          onClick={handleNewTab}
          className="flex items-center justify-center w-7 h-[30px] rounded-md text-secondary hover:text-primary hover:bg-surface/60 dark:hover:bg-white/[0.06] transition-colors ml-1 cursor-pointer shrink-0 mb-0.5 outline-none focus:outline-none focus-visible:outline-none"
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
          className="flex items-center justify-center w-7 h-7 rounded-md text-secondary hover:text-primary hover:bg-surface/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
          title={`${t.settings.title} (Ctrl+,)`}
          aria-label={t.settings.title}
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};
