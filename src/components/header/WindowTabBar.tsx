import React from "react";
import { Plus, X, Settings, GitBranch } from "lucide-react";
import { clsx } from "clsx";
import { useTabStore } from "../../store/useTabStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n";

interface WindowTabBarProps {
  onNewTab?: () => void;
}

// Icon Windows 11 Home chính xác: Mái nhà cam terracotta, tường xám
const Win11HomeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={clsx("shrink-0", className)} viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5L2 11h3v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9h3L12 2.5z" fill="#d85226" />
    <path d="M5 11v9h14v-9l-7-6-7 6z" fill="#9aa5b1" opacity="0.9" />
    <path d="M10 20v-5h4v5h-4z" fill="#52606d" />
  </svg>
);

// Icon Windows 11 Yellow Folder chính xác: Folder tab vàng hổ phách
const Win11FolderIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={clsx("shrink-0 text-[#f0b429]", className)} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V9a3 3 0 0 0-3-3h-3.414l-1.707-1.707A2 2 0 0 0 8.464 3.707H4.5A3 3 0 0 0 1.5 6.707V18a3 3 0 0 0 3 3h15z" />
  </svg>
);

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
      className="flex items-end justify-between px-2 h-[40px] min-h-[40px] max-h-[40px] bg-[#cfe3ec] dark:bg-[#1b2029] border-b border-[#bcccd6] dark:border-slate-800 select-none z-30 shrink-0 gap-2 pt-1.5"
    >
      {/* Scrollable Windows 11 Explorer Tabs Container */}
      <div className="flex items-end h-full gap-0 flex-1 min-w-0 overflow-x-auto no-scrollbar">
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
                    "group relative flex items-center gap-2.5 px-3.5 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 select-none min-w-[150px] max-w-[220px]",
                    isActive
                      ? "bg-surface text-primary font-normal shadow-xs border-t border-l border-r border-black/[0.06] dark:border-white/[0.06] after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                      : "text-secondary hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-normal"
                  )}
                  title="Home (Welcome)"
                >
                  <Win11HomeIcon className="w-4 h-4" />
                  <span className="truncate">Home</span>
                </div>
                {!isActive && !isNextActive && idx < tabs.length - 1 && (
                  <div className="h-4 w-[1px] bg-slate-400/40 dark:bg-slate-600/40 my-auto shrink-0 mx-0.5" />
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
                  "group relative flex items-center gap-2.5 px-3.5 h-[34px] rounded-t-lg text-[13px] cursor-pointer transition-colors shrink-0 min-w-[150px] max-w-[240px] select-none",
                  isActive
                    ? "bg-surface text-primary font-normal shadow-xs border-t border-l border-r border-black/[0.06] dark:border-white/[0.06] after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[2px] after:bg-surface"
                    : "text-secondary hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-normal"
                )}
                title={`${repoName} - ${tab.id}`}
              >
                <Win11FolderIcon className="w-4 h-4" />
                <span className="truncate">{repoName}</span>

                {branchName && (
                  <span
                    className="text-[10px] font-mono text-secondary/80 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.2 rounded-full flex items-center gap-1 shrink-0 max-w-[75px] truncate"
                    title={`Branch: ${branchName}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <GitBranch size={9} className="shrink-0 text-emerald-600" />
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
                  className="ml-auto flex items-center justify-center w-5 h-5 rounded hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-secondary hover:text-primary transition-colors shrink-0"
                  aria-label={`Close tab ${repoName}`}
                >
                  <X size={12} strokeWidth={1.75} />
                </button>
              </div>
              {!isActive && !isNextActive && idx < tabs.length - 1 && (
                <div className="h-4 w-[1px] bg-slate-400/40 dark:bg-slate-600/40 my-auto shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}

        {/* Windows 11 Style Minimal New Tab Button (+) */}
        <button
          type="button"
          data-testid="btn-new-tab"
          onClick={handleNewTab}
          className="flex items-center justify-center w-8 h-[30px] rounded-md text-secondary hover:text-primary hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors ml-1 cursor-pointer shrink-0 mb-0.5"
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
          className="flex items-center justify-center w-7 h-7 rounded-md text-secondary hover:text-primary hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          title={`${t.settings.title} (Ctrl+,)`}
          aria-label={t.settings.title}
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};
